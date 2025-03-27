import * as vscode from 'vscode';
import { EXTENSION_ID } from './constants/extension';
import { ImageItemTreeDataProvider as ImageItemsTreeDataProvider } from './providers/image_item_tree_data_provider';
import { ImageDetailsProvider as ImageDetailItemsTreeDataProvider } from './providers/image_details_provider';
import { ImageItemContextType } from './models/image_item';

export function activate(context: vscode.ExtensionContext) {
	console.log(`"${EXTENSION_ID}" is actived!`);

	const imageItemsTreeDataProvider = new ImageItemsTreeDataProvider(context);
	const imageDetailItemsTreeDataProvider = new ImageDetailItemsTreeDataProvider();

	const imagesTreeView = vscode.window.createTreeView(`${EXTENSION_ID}.explorer`, {
		treeDataProvider: imageItemsTreeDataProvider,
		showCollapseAll: true
	});

	const detailsTreeView = vscode.window.createTreeView(`${EXTENSION_ID}.details`, {
		treeDataProvider: imageDetailItemsTreeDataProvider
	});

	imagesTreeView.onDidChangeSelection(e => {
		if (e.selection.length === 0) {
			return;
		}

		const selectedItem = e.selection[0];

		if (selectedItem.contextType === ImageItemContextType.Image) {
			imageDetailItemsTreeDataProvider.setSelectedImage(selectedItem.resourceUri);
		}
	});

	context.subscriptions.push(
		imagesTreeView,
		detailsTreeView,
	);

	const refreshCommand = vscode.commands.registerCommand(`${EXTENSION_ID}.refresh`, () => {
		imageItemsTreeDataProvider.refresh();
		imageDetailItemsTreeDataProvider.refresh();
	});

	const openImageCommand = vscode.commands.registerCommand(`${EXTENSION_ID}.openImage`, (resource: vscode.Uri) => {
		vscode.commands.executeCommand('vscode.open', resource);
	});

	const revealInExplorerCommand = vscode.commands.registerCommand(`${EXTENSION_ID}.revealInExplorer`, () => {
		const resource = imageDetailItemsTreeDataProvider.getSelectedImage();

		if (!resource) {
			vscode.window.showErrorMessage('No image selected');

			return;
		}

		vscode.commands.executeCommand('revealFileInOS', resource);
	});

	context.subscriptions.push(
		refreshCommand,
		openImageCommand,
		revealInExplorerCommand,
	);
}

export function deactivate() { }
