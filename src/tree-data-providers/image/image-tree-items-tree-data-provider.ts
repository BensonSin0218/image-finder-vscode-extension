import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { IMAGE_EXTENSIONS } from '../../constants/image.js';
import { ImageTreeItem, } from './image-tree-item.js';
import { EXTENSION_ID } from '../../constants/extension.js';

export class ImageTreeItemsTreeDataProvider implements vscode.TreeDataProvider<ImageTreeItem> {
	constructor(context: vscode.ExtensionContext) {
		this.workspace = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
			? vscode.workspace.workspaceFolders[0].uri.fsPath
			: undefined;

		if (!this.workspace) {
			vscode.window.showErrorMessage('No workspace found');

			return;
		}

		console.log(`[${ImageTreeItemsTreeDataProvider.name}] Workspace root: ${this.workspace}`);

		this.findAllImagesInWorkspace(this.workspace);
	}

	private _onDidChangeTreeData: vscode.EventEmitter<ImageTreeItem | undefined | null | void> = new vscode.EventEmitter<ImageTreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<ImageTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

	private workspace: string | undefined;
	private images: ImageTreeItem[] = [];

	refresh = () => {
		this.findAllImagesInWorkspace(this.workspace!);
		this._onDidChangeTreeData.fire();
	};

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

		const skipHiddenDirectories = vscode.workspace.getConfiguration('image-explorer').get<boolean>('skipHiddenDirectories', true);
		const skipSymbolicLink = vscode.workspace.getConfiguration('image-explorer').get<boolean>('skipSymbolicLink', true);

		this.images = [];

		const processDirectory = async (dir: string) => {
			try {
				const pathBaseName = path.basename(dir);

				if (skipHiddenDirectories && pathBaseName.includes('.')) {
					return;
				}

				const files = fs.readdirSync(dir);

				for (const file of files) {
					const filePath = path.join(dir, file);
					const stat = fs.lstatSync(filePath);

					if (skipSymbolicLink && stat.isSymbolicLink()) {
						continue;
					}

					if (stat.isDirectory()) {
						await processDirectory(filePath);
					} else if (stat.isFile() && IMAGE_EXTENSIONS.some(ext => file.toLowerCase().endsWith(ext))) {
						this.images.push(
							new ImageTreeItem(
								file,
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

		console.log(`[${ImageTreeItemsTreeDataProvider.name}] Found ${this.images.length} images in workspace`);
	};

	getAllImagesUris = () => this.images.map(image => image.uri);
}