import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { IMAGE_EXTENSIONS } from '../constants/images';
import { ImageItem, ImageItemContextType } from '../models/image_item';
import { EXTENSION_ID } from '../constants/extension';

export class ImageItemTreeDataProvider implements vscode.TreeDataProvider<ImageItem> {
	constructor(context: vscode.ExtensionContext) {
		this._workspaceRoot = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
			? vscode.workspace.workspaceFolders[0].uri.fsPath
			: undefined;

		if (!this._workspaceRoot) {
			vscode.window.showErrorMessage('No workspace found');

			return;
		}

		console.log(`[${ImageItemTreeDataProvider.name}] Workspace root: ${this._workspaceRoot}`);

		const imageExtensionNames = IMAGE_EXTENSIONS.map((extension) => extension.substring(1));
		const watcher = vscode.workspace.createFileSystemWatcher(`**/*.{${imageExtensionNames.join(',')}}`);

		watcher.onDidCreate(() => this.refresh());
		watcher.onDidDelete(() => this.refresh());
		watcher.onDidChange(() => this.refresh());

		context.subscriptions.push(watcher);
	}

	private _workspaceRoot: string | undefined;
	private _onDidChangeTreeData: vscode.EventEmitter<ImageItem | undefined | null | void> = new vscode.EventEmitter<ImageItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<ImageItem | undefined | null | void> = this._onDidChangeTreeData.event;

	refresh = () => this._onDidChangeTreeData.fire();

	getTreeItem = (element: ImageItem): vscode.TreeItem => element;

	getChildren = async (element?: ImageItem): Promise<ImageItem[]> => {
		if (!this._workspaceRoot) {
			vscode.window.showInformationMessage('No images found in empty workspace');

			return Promise.resolve([]);
		}

		if (element) {
			return this.getImagesInDirectory(element.resourceUri.fsPath);
		} else {
			return this.getImagesInDirectory(this._workspaceRoot!);
		}
	};

	private checkDirectoryContainsImages = (directoryPath: string): boolean => {
		try {
			const dirContents = fs.readdirSync(directoryPath);
			const hasImagesInThisDir = dirContents.some(f =>
				fs.statSync(path.join(directoryPath, f)).isFile() &&
				IMAGE_EXTENSIONS.some(ext => f.toLowerCase().endsWith(ext))
			);

			if (hasImagesInThisDir) {
				return true;
			}

			for (const item of dirContents) {
				const itemPath = path.join(directoryPath, item);
				if (fs.statSync(itemPath).isDirectory()) {
					if (this.checkDirectoryContainsImages(itemPath)) {
						return true;
					}
				}
			}

			return false;
		} catch (error) {
			vscode.window.showErrorMessage(`Error checking directory for images ${directoryPath}: ${error}`);
			console.error(`Error checking directory for images ${directoryPath}:`, error);

			return false;
		}
	};

	private getImagesInDirectory = async (directoryPath: string): Promise<ImageItem[]> => {
		if (!fs.existsSync(directoryPath)) {
			return [];
		}

		const items: ImageItem[] = [];
		const files = fs.readdirSync(directoryPath);

		for (const file of files) {
			const filePath = path.join(directoryPath, file);
			const stat = fs.statSync(filePath);

			if (stat.isDirectory()) {
				try {
					const hasImages = this.checkDirectoryContainsImages(filePath);

					if (hasImages) {
						items.push(
							new ImageItem(
								file,
								vscode.TreeItemCollapsibleState.Collapsed,
								vscode.Uri.file(filePath),
								ImageItemContextType.Folder
							));
					}
				} catch (error) {
					vscode.window.showErrorMessage(`Error reading directory ${filePath}: ${error}`);
					console.error(`Error reading directory ${filePath}:`, error);
				}
			} else if (stat.isFile() && IMAGE_EXTENSIONS.some(ext => file.toLowerCase().endsWith(ext))) {
				items.push(
					new ImageItem(
						file,
						vscode.TreeItemCollapsibleState.None,
						vscode.Uri.file(filePath),
						ImageItemContextType.Image,
						{
							command: `${EXTENSION_ID}.openImage`,
							title: 'Open Image',
							arguments: [vscode.Uri.file(filePath)]
						}
					));
			}
		}

		return items.sort((a, b) => {
			if (a.contextType === ImageItemContextType.Folder && b.contextType !== ImageItemContextType.Folder) {
				return -1;
			}
			else if (a.contextType !== ImageItemContextType.Folder && b.contextType === ImageItemContextType.Folder) {
				return 1;
			}

			return a.label!.localeCompare(b.label!);
		});
	};
}