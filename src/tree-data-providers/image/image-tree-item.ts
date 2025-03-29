import * as vscode from 'vscode';
import * as fs from 'fs';
import { formatFileSize } from '../../utils/file-size';

export class ImageTreeItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly resourceUri: vscode.Uri,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);

		this.iconPath = new vscode.ThemeIcon('file-media');
		this.tooltip = resourceUri.fsPath;

		try {
			const stat = fs.statSync(resourceUri.fsPath);

			this.description = formatFileSize(stat.size);
		} catch (error) {
			console.error('Error getting file stats:', error);
		}
	}
}