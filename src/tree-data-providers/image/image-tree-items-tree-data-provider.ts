import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { IMAGE_EXTENSIONS } from '../../constants/image';
import { ImageTreeItem } from './image-tree-item';
import { EXTENSION_ID } from '../../constants/extension';

export class ImageTreeItemsTreeDataProvider implements vscode.TreeDataProvider<ImageTreeItem> {
	constructor() {
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

		const includeDirectories = vscode.workspace.getConfiguration(EXTENSION_ID, vscode.Uri.file(this.workspace!)).get<string[]>('includeDirectories', []).map(folder => path.join(this.workspace!, folder));
		const skipSymbolicLink = vscode.workspace.getConfiguration(EXTENSION_ID, vscode.Uri.file(this.workspace!)).get<boolean>('skipSymbolicLink', true);

		this.images = [];

		console.log(`[${ImageTreeItemsTreeDataProvider.name}] includeDirectories: ${includeDirectories}`);

		const processDirectory = async (directory: string) => {
			try {
				const files = fs.readdirSync(directory);

				for (const file of files) {
					const filePath = path.join(directory, file);
					const stat = fs.lstatSync(filePath);

					if (skipSymbolicLink && stat.isSymbolicLink()) {
						continue;
					}

					if (!includeDirectories.some(folder => filePath.startsWith(folder))) {
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
				vscode.window.showErrorMessage(`Error processing directory ${directory}: ${error}`);
				console.error(`Error processing directory ${directory}:`, error);
			}
		};

		await processDirectory(directoryPath);

		this.images.sort((a, b) => a.label!.localeCompare(b.label!));

		const messageDisposable = vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: `Found ${this.images.length} images in workspace`,
				cancellable: false
			},
			async (progress) => {
				return new Promise<void>(resolve => setTimeout(resolve, 2000));
			}
		);
		console.log(`[${ImageTreeItemsTreeDataProvider.name}] Found ${this.images.length} images in workspace`);
	};

	getAllImagesUris = () => this.images.map(image => image.uri);
}