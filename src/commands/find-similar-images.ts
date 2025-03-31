import * as vscode from 'vscode';
import sharp from 'sharp';
import hammingDistance from 'hamming-distance';
import { IMAGE_FILTERS } from '../constants/image.js';
import { ImageTreeItemsTreeDataProvider } from '../tree-data-providers/image/image-tree-items-tree-data-provider.js';
import { SimilarImageTreeItemsTreeDataProvider } from '../tree-data-providers/similar-image/similar-image-tree-items-tree-data-provider.js';

export type SimilarImage = { uri: vscode.Uri; similarity: number };

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
  const selectedImageHash = await generateHash(selectedImageUri.fsPath);

  if (!selectedImageHash) {
    vscode.window.showErrorMessage('Could not process the selected image');
    return;
  }

  const similarityThreshold = vscode.workspace.getConfiguration('image-explorer').get<number>('similarityThreshold', 90);
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
        const currentHash = await generateHash(imageUri.fsPath);
        if (currentHash) {
          const distance = hammingDistance(selectedImageHash, currentHash);
          const similarity = 100 - (distance / selectedImageHash.length * 100);

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

async function generateHash(imagePath: string): Promise<string> {
  try {
    const similarityImageResize = vscode.workspace.getConfiguration('image-explorer').get<number>('similarityImageResize', 32);
    const buffer = await sharp(imagePath)
      .resize(similarityImageResize, similarityImageResize, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer();

    let hash = '';
    const avg = buffer.reduce((sum, val) => sum + val, 0) / buffer.length;

    for (const pixel of buffer) {
      hash += pixel >= avg ? '1' : '0';
    }

    return hash;
  } catch (error) {
    console.error(`Error generating hash for ${imagePath}:`, error);
    return '';
  }
}
