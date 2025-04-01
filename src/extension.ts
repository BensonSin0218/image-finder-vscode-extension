import * as vscode from 'vscode';
import { refreshAllViews } from './commands/refresh-all-views';
import { revealInExplorer } from './commands/reveal-in-explorer';
import { findSimilarImages } from './commands/find-similar-images';
import { EXTENSION_ID } from './constants/extension';
import { ImageDetailTreeItemsTreeDataProvider } from './tree-data-providers/image-detail/image-detail-tree-items-tree-data-provider';
import { ImageTreeItemsTreeDataProvider } from './tree-data-providers/image/image-tree-items-tree-data-provider';
import { SimilarImageTreeItemsTreeDataProvider } from './tree-data-providers/similar-image/similar-image-tree-items-tree-data-provider';

export function activate(context: vscode.ExtensionContext) {
	console.log(`"${EXTENSION_ID}" is activated!`);

	const imageTreeItemsTreeDataProvider = new ImageTreeItemsTreeDataProvider();
	const imageDetailTreeItemsTreeDataProvider = new ImageDetailTreeItemsTreeDataProvider();
	const similarImageTreeItemsTreeDataProvider = new SimilarImageTreeItemsTreeDataProvider();

	const imageTreeItemsTreeView = vscode.window.createTreeView(`${EXTENSION_ID}.imageTreeItemsTreeView`, {
		treeDataProvider: imageTreeItemsTreeDataProvider,
		showCollapseAll: true
	});

	imageTreeItemsTreeView.onDidChangeSelection(e => {
		if (e.selection.length === 0) {
			return;
		}

		const selectedItem = e.selection[0];

		imageDetailTreeItemsTreeDataProvider.setSelectedImage(selectedItem.uri);
	});

	const imageDetailTreeItemsTreeView = vscode.window.createTreeView(`${EXTENSION_ID}.imageDetailTreeItemsTreeView`, {
		treeDataProvider: imageDetailTreeItemsTreeDataProvider
	});

	const similarImageTreeItemsTreeView = vscode.window.createTreeView(`${EXTENSION_ID}.similarImageTreeItemsTreeView`, {
		treeDataProvider: similarImageTreeItemsTreeDataProvider,
	});

	similarImageTreeItemsTreeView.onDidChangeSelection(e => {
		if (e.selection.length === 0) {
			return;
		}

		const selectedItem = e.selection[0];

		imageDetailTreeItemsTreeDataProvider.setSelectedImage(selectedItem.uri);
	});

	context.subscriptions.push(
		imageTreeItemsTreeView,
		imageDetailTreeItemsTreeView,
		similarImageTreeItemsTreeView,
	);

	const refreshAllViewsCommand = vscode.commands.registerCommand(`${EXTENSION_ID}.refreshAllViews`, () => refreshAllViews([imageTreeItemsTreeDataProvider, imageDetailTreeItemsTreeDataProvider]));

	const openSettingsCommand = vscode.commands.registerCommand(`${EXTENSION_ID}.openSettings`, () => vscode.commands.executeCommand('workbench.action.openSettings', 'image-finder'));

	const openImageCommand = vscode.commands.registerCommand(`${EXTENSION_ID}.openImage`, (resource: vscode.Uri) => vscode.commands.executeCommand('vscode.open', resource));

	const revealInExplorerCommand = vscode.commands.registerCommand(`${EXTENSION_ID}.revealInExplorer`, () => revealInExplorer(imageDetailTreeItemsTreeDataProvider));

	const findSimilarImagesCommand = vscode.commands.registerCommand(`${EXTENSION_ID}.findSimilarImages`, () =>
		findSimilarImages(imageTreeItemsTreeDataProvider, similarImageTreeItemsTreeDataProvider));

	context.subscriptions.push(
		refreshAllViewsCommand,
		openSettingsCommand,
		openImageCommand,
		revealInExplorerCommand,
		findSimilarImagesCommand,
	);
}

export function deactivate() { }
