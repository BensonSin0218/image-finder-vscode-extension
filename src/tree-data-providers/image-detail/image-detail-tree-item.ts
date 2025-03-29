import * as vscode from 'vscode';

export enum ImageDetailTreeItemType {
  Name = 'Name',
  Path = 'Path',
  Size = 'Size',
  Created = 'Created',
  Modified = 'Modified'
}

export namespace ImageDetailTreeItemType {
  export const getThemeIcon = (type: ImageDetailTreeItemType): vscode.ThemeIcon => new vscode.ThemeIcon((() => {
    switch (type) {
    case ImageDetailTreeItemType.Name:
      return 'file';

    case ImageDetailTreeItemType.Path:
      return 'folder';

    case ImageDetailTreeItemType.Size:
      return 'file-binary';

    case ImageDetailTreeItemType.Created:
      return 'calendar';

    case ImageDetailTreeItemType.Modified:
      return 'edit';

    default:
      return 'symbol-property';
    }
  })());
}

export class ImageDetailTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command,
  ) {
    super(label, collapsibleState);

    this.tooltip = `${this.label}: ${this.description}`;
    this.iconPath = ImageDetailTreeItemType.getThemeIcon(this.label as ImageDetailTreeItemType);
  }
}
