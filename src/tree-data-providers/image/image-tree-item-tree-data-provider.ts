import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { IMAGE_EXTENSIONS } from '../../constants/image.js';
import { ImageTreeItem, } from './image-tree-item.js';
import { EXTENSION_ID } from '../../constants/extension.js';

export class ImageTreeItemTreeDataProvider implements vscode.TreeDataProvider<ImageTreeItem> {
	constructor(context: vscode.ExtensionContext) {
		this.workspace = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
			? vscode.workspace.workspaceFolders[0].uri.fsPath
			: undefined;

		if (!this.workspace) {
			vscode.window.showErrorMessage('No workspace found');

			return;
		}

		console.log(`[${ImageTreeItemTreeDataProvider.name}] Workspace root: ${this.workspace}`);

		const imageExtensionNames = IMAGE_EXTENSIONS.map((extension) => extension.substring(1));
		const watcher = vscode.workspace.createFileSystemWatcher(`**/*.{${imageExtensionNames.join(',')}}`);

		watcher.onDidCreate(() => this.refresh());
		watcher.onDidDelete(() => this.refresh());
		watcher.onDidChange(() => this.refresh());

		context.subscriptions.push(watcher);

		this.findAllImagesInWorkspace(this.workspace);
	}

	private _onDidChangeTreeData: vscode.EventEmitter<ImageTreeItem | undefined | null | void> = new vscode.EventEmitter<ImageTreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<ImageTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

	private workspace: string | undefined;
	private images: ImageTreeItem[] = [];

	refresh = () => this._onDidChangeTreeData.fire();

	getTreeItem = (element: ImageTreeItem): vscode.TreeItem => element;

	getChildren = async (element?: ImageTreeItem): Promise<ImageTreeItem[]> => {
		if (!this.workspace) {
			vscode.window.showInformationMessage('No images found in empty workspace');

			return Promise.resolve([]);
		}

		if (element) {
			return Promise.resolve([]);
		}

		return this.images;
	};

	private findAllImagesInWorkspace = async (directoryPath: string): Promise<void> => {
		if (!fs.existsSync(directoryPath)) {
			return;
		}

		this.images = [];

		const processDirectory = async (dir: string) => {
			try {
				const pathBaseName = path.basename(dir);

				if (pathBaseName.includes('.')) {
					return;
				}

				const files = fs.readdirSync(dir);

				for (const file of files) {
					const filePath = path.join(dir, file);
					const stat = fs.lstatSync(filePath);

					if (stat.isSymbolicLink()) {
						continue;
					}

					if (stat.isDirectory()) {
						await processDirectory(filePath);
					} else if (stat.isFile() && IMAGE_EXTENSIONS.some(ext => file.toLowerCase().endsWith(ext))) {
						const relativePath = path.relative(this.workspace!, dir);
						const displayPath = relativePath ? `${relativePath}/${file}` : file;

						this.images.push(
							new ImageTreeItem(
								displayPath,
								vscode.TreeItemCollapsibleState.None,
								vscode.Uri.file(filePath),
								{
									command: `${EXTENSION_ID}.openImage`,
									title: 'Open Image',
									arguments: [vscode.Uri.file(filePath)]
								}
							)
						);
					}
				}
			} catch (error) {
				vscode.window.showErrorMessage(`Error processing directory ${dir}: ${error}`);
				console.error(`Error processing directory ${dir}:`, error);
			}
		};

		await processDirectory(directoryPath);

		this.images.sort((a, b) => a.label!.localeCompare(b.label!));

		console.log(`[${ImageTreeItemTreeDataProvider.name}] Found ${this.images.length} images in workspace`);
	};
}