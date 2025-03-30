import * as vscode from 'vscode';

export class SimilarImageTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly uri: vscode.Uri,
    public readonly command?: vscode.Command) {
    super(label, collapsibleState);

    this.tooltip = `${this.label}: ${this.description}`;
    this.iconPath = new vscode.ThemeIcon('file-media');
  }
}