import * as vscode from 'vscode';
import * as fs from 'fs';
import { formatFileSize } from '../../utils/file-size';

export enum ImageTreeItemType {
	Folder = 'Folder',
	Image = 'Image',
}

export namespace ImageTreeItemType {
	export const getThemeIcon = (type: ImageTreeItemType): vscode.ThemeIcon => new vscode.ThemeIcon((() => {
		switch (type) {
		case ImageTreeItemType.Folder:
			return 'folder';

		case ImageTreeItemType.Image:
			return 'file-media';
		}
	})());
}

export class ImageTreeItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly resourceUri: vscode.Uri,
		public readonly type: ImageTreeItemType,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);

		this.iconPath = ImageTreeItemType.getThemeIcon(type);
		this.tooltip = resourceUri.fsPath;

		if (type !== ImageTreeItemType.Folder) {
			try {
				const stat = fs.statSync(resourceUri.fsPath);

				this.description = formatFileSize(stat.size);
			} catch (error) {
				console.error('Error getting file stats:', error);
			}
		}
	}
}