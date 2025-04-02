import * as vscode from 'vscode';
import sharp from 'sharp';
import hammingDistance from 'hamming-distance';
import { IMAGE_FILTERS } from '../constants/image.js';
import { ImageTreeItemsTreeDataProvider } from '../tree-data-providers/image/image-tree-items-tree-data-provider.js';
import { SimilarImageTreeItemsTreeDataProvider } from '../tree-data-providers/similar-image/similar-image-tree-items-tree-data-provider.js';
import { EXTENSION_ID } from '../constants/extension.js';

export type SimilarImage = { uri: vscode.Uri; similarity: number };

type ImageFeatures = {
  pHash: string;
  dHash: string;
  colorHistogram: number[];
  edgeHash: string;
};

const imageFeatureWeight = {
  // Perceptual hash
  pHash: 0.35,
  // Difference hash
  dHash: 0.25,
  // Color histogram
  color: 0.20,
  // Edge structure
  edge: 0.20
};

const calculateSimilarity = (features1: ImageFeatures, features2: ImageFeatures): number => {
  const pHashDistance = hammingDistance(features1.pHash, features2.pHash);
  const pHashSimilarity = 100 - (pHashDistance / features1.pHash.length * 100);

  const dHashDistance = hammingDistance(features1.dHash, features2.dHash);
  const dHashSimilarity = 100 - (dHashDistance / features1.dHash.length * 100);

  const edgeHashDistance = hammingDistance(features1.edgeHash, features2.edgeHash);
  const edgeHashSimilarity = 100 - (edgeHashDistance / features1.edgeHash.length * 100);

  const colorSimilarity = calculateColorHistogramSimilarity(features1.colorHistogram, features2.colorHistogram);

  const weightedSimilarity =
    imageFeatureWeight.pHash * pHashSimilarity +
    imageFeatureWeight.dHash * dHashSimilarity +
    imageFeatureWeight.color * colorSimilarity +
    imageFeatureWeight.edge * edgeHashSimilarity;

  return weightedSimilarity;
};

const calculateColorHistogramSimilarity = (histogram1: number[], histogram2: number[]): number => {
  let chiSquareDistance = 0;

  for (let i = 0; i < histogram1.length; i++) {
    const sum = histogram1[i] + histogram2[i];
    if (sum > 0) {
      const diff = histogram1[i] - histogram2[i];
      chiSquareDistance += (diff * diff) / sum;
    }
  }

  return 100 * Math.exp(-chiSquareDistance / 2);
};

const extractImageFeatures = async (imagePath: string): Promise<ImageFeatures | null> => {
  try {
    const similarityImageResize = vscode.workspace.getConfiguration(EXTENSION_ID).get<number>('similarityImageResize', 32);

    const image = sharp(imagePath);

    const pHashBuffer = await image
      .clone()
      .resize(similarityImageResize, similarityImageResize, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer();

    let pHash = '';
    const pHashAvg = pHashBuffer.reduce((sum, val) => sum + val, 0) / pHashBuffer.length;
    for (const pixel of pHashBuffer) {
      pHash += pixel >= pHashAvg ? '1' : '0';
    }

    const dHashSize = similarityImageResize - 1;
    const dHashBuffer = await image
      .clone()
      .resize(similarityImageResize, similarityImageResize, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer();

    let dHash = '';
    for (let y = 0; y < similarityImageResize; y++) {
      for (let x = 0; x < dHashSize; x++) {
        const idx = y * similarityImageResize + x;
        const nextIdx = y * similarityImageResize + (x + 1);
        dHash += dHashBuffer[idx] > dHashBuffer[nextIdx] ? '1' : '0';
      }
    }

    const colorBins = 8;
    const histogramSize = colorBins * colorBins * colorBins;
    const colorHistogram = new Array(histogramSize).fill(0);

    const colorBuffer = await image
      .clone()
      .resize(similarityImageResize, similarityImageResize, { fit: 'fill' })
      .raw()
      .toBuffer();

    for (let i = 0; i < colorBuffer.length; i += 3) {
      const r = Math.floor(colorBuffer[i] / (256 / colorBins));
      const g = Math.floor(colorBuffer[i + 1] / (256 / colorBins));
      const b = Math.floor(colorBuffer[i + 2] / (256 / colorBins));

      const binIndex = (r * colorBins * colorBins) + (g * colorBins) + b;
      colorHistogram[binIndex]++;
    }

    const pixelCount = (similarityImageResize * similarityImageResize);
    for (let i = 0; i < colorHistogram.length; i++) {
      colorHistogram[i] = colorHistogram[i] / pixelCount;
    }

    const edgeBuffer = await image
      .clone()
      .resize(similarityImageResize, similarityImageResize, { fit: 'fill' })
      .grayscale()
      .convolve({
        width: 3,
        height: 3,
        kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
      })
      .normalize()
      .raw()
      .toBuffer();

    let edgeHash = '';
    const edgeAvg = edgeBuffer.reduce((sum, val) => sum + val, 0) / edgeBuffer.length;
    for (const pixel of edgeBuffer) {
      edgeHash += pixel >= edgeAvg ? '1' : '0';
    }

    return {
      pHash,
      dHash,
      colorHistogram,
      edgeHash
    };

  } catch (error) {
    console.error(`Error extracting features for ${imagePath}:`, error);
    return null;
  }
};

export const findSimilarImages = async (
  imageTreeItemsTreeDataProvider: ImageTreeItemsTreeDataProvider,
  similarImageTreeItemsTreeDataProvider: SimilarImageTreeItemsTreeDataProvider
) => {
  const allImagesUris = imageTreeItemsTreeDataProvider.getAllImagesUris();

  if (allImagesUris.length === 0) {
    vscode.window.showErrorMessage('No images found in workspace');
    return;
  }

  const selectedImageUris = await vscode.window.showOpenDialog({
    canSelectMany: false,
    canSelectFolders: false,
    filters: IMAGE_FILTERS,
    title: 'Select Image',
    openLabel: 'Find Similar Images'
  });

  if (!selectedImageUris || selectedImageUris.length === 0) {
    return;
  }

  const selectedImageUri = selectedImageUris[0];
  const selectedImageFeatures = await extractImageFeatures(selectedImageUri.fsPath);

  if (!selectedImageFeatures) {
    vscode.window.showErrorMessage('Could not process the selected image');
    return;
  }

  const similarityThreshold = vscode.workspace.getConfiguration(EXTENSION_ID).get<number>('similarityThreshold', 90);
  const similarImages: SimilarImage[] = [];

  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Finding similar images',
    cancellable: true
  }, async (progress, token) => {
    let processed = 0;

    for (const imageUri of allImagesUris) {
      if (token.isCancellationRequested) {
        return;
      }

      try {
        const currentFeatures = await extractImageFeatures(imageUri.fsPath);
        if (currentFeatures) {
          const similarity = calculateSimilarity(selectedImageFeatures, currentFeatures);

          if (similarity > similarityThreshold) {
            similarImages.push({ uri: imageUri, similarity });
          }
        }
      } catch (err) {
        vscode.window.showErrorMessage(`Error processing ${imageUri.fsPath}:` + (err instanceof Error ? err.message : String(err)));
        console.error(`Error processing ${imageUri.fsPath}:`, err);
      }

      processed++;
      progress.report({
        message: `Comparing images (${processed}/${allImagesUris.length})`,
        increment: 100 / allImagesUris.length
      });
    }
  });

  similarImages.sort((a, b) => b.similarity - a.similarity);

  if (similarImages.length === 0) {
    vscode.window.showErrorMessage('No similar images found.');
  }

  similarImageTreeItemsTreeDataProvider.setSimilarImages(similarImages);
};

