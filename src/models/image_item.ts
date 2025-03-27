import * as vscode from 'vscode';
import * as fs from 'fs';
import { formatFileSize } from '../utils/file_size';

export enum ImageItemContextType {
	Folder = 'Folder',
	Image = 'Image',
}

export namespace ImageItemContextType {
	export const getThemeIcon = (type: ImageItemContextType): vscode.ThemeIcon => {
		switch (type) {
		case ImageItemContextType.Folder:
			return new vscode.ThemeIcon('folder');

		case ImageItemContextType.Image:
			return new vscode.ThemeIcon('file-media');
		}
	};
}

export class ImageItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly resourceUri: vscode.Uri,
		public readonly contextType: ImageItemContextType,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);

		this.iconPath = ImageItemContextType.getThemeIcon(contextType);
		this.tooltip = resourceUri.fsPath;

		if (contextType !== ImageItemContextType.Folder) {
			try {
				const stat = fs.statSync(resourceUri.fsPath);
				this.description = formatFileSize(stat.size);
			} catch (error) {
				console.error('Error getting file stats:', error);
			}
		}
	}
}