import * as vscode from 'vscode';

export enum ImageDetailItemContextType {
  Name = 'Name',
  Path = 'Path',
  Size = 'Size',
  Created = 'Created',
  Modified = 'Modified'
}

export namespace ImageDetailItemContextType {
  export const getThemeIcon = (type: ImageDetailItemContextType): vscode.ThemeIcon => {
    switch (type) {
    case ImageDetailItemContextType.Name:
      return new vscode.ThemeIcon('file');

    case ImageDetailItemContextType.Path:
      return new vscode.ThemeIcon('folder');

    case ImageDetailItemContextType.Size:
      return new vscode.ThemeIcon('file-binary');

    case ImageDetailItemContextType.Created:
      return new vscode.ThemeIcon('calendar');

    case ImageDetailItemContextType.Modified:
      return new vscode.ThemeIcon('edit');

    default:
      return new vscode.ThemeIcon('symbol-property');
    }
  };
}

export class ImageDetailItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command,
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}: ${this.description}`;
    this.iconPath = ImageDetailItemContextType.getThemeIcon(this.label as ImageDetailItemContextType);
  }
}
