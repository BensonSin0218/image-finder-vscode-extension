import * as vscode from 'vscode';
import { refreshAllViews } from './commands/refresh-all-views';
import { revealInExplorer } from './commands/reveal-in-explorer';
import { EXTENSION_ID } from './constants/extension';
import { ImageDetailTreeItemsTreeDataProvider } from './tree-data-providers/image-detail/image-detail-tree-items-tree-data-provider';
import { ImageTreeItemTreeDataProvider } from './tree-data-providers/image/image-tree-item-tree-data-provider';

export function activate(context: vscode.ExtensionContext) {
	console.log(`"${EXTENSION_ID}" is activated!`);

	const imageTreeItemTreeDataProvider = new ImageTreeItemTreeDataProvider(context);
	const imageDetailTreeItemsTreeDataProvider = new ImageDetailTreeItemsTreeDataProvider();

	const imageItemsTreeView = vscode.window.createTreeView(`${EXTENSION_ID}.imageItemsTreeView`, {
		treeDataProvider: imageTreeItemTreeDataProvider,
		showCollapseAll: true
	});

	imageItemsTreeView.onDidChangeSelection(e => {
		if (e.selection.length === 0) {
			return;
		}

		const selectedItem = e.selection[0];

		imageDetailTreeItemsTreeDataProvider.setSelectedImage(selectedItem.resourceUri);
	});

	const imageDetailItemsTreeView = vscode.window.createTreeView(`${EXTENSION_ID}.imageDetailItemsTreeView`, {
		treeDataProvider: imageDetailTreeItemsTreeDataProvider
	});

	context.subscriptions.push(
		imageItemsTreeView,
		imageDetailItemsTreeView,
	);

	const refreshAllViewsCommand = vscode.commands.registerCommand(`${EXTENSION_ID}.refreshAllViews`, () => refreshAllViews([imageTreeItemTreeDataProvider, imageDetailTreeItemsTreeDataProvider]));

	const openImageCommand = vscode.commands.registerCommand(`${EXTENSION_ID}.openImage`, (resource: vscode.Uri) => vscode.commands.executeCommand('vscode.open', resource));

	const revealInExplorerCommand = vscode.commands.registerCommand(`${EXTENSION_ID}.revealInExplorer`, () => revealInExplorer(imageDetailTreeItemsTreeDataProvider));

	context.subscriptions.push(
		refreshAllViewsCommand,
		openImageCommand,
		revealInExplorerCommand,
	);
}

export function deactivate() { }
