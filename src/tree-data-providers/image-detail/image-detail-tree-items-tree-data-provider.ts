import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { formatFileSize } from '../../utils/file-size';
import { ImageDetailTreeItem, ImageDetailTreeItemType } from './image-detail-tree-item';

export class ImageDetailTreeItemsTreeDataProvider implements vscode.TreeDataProvider<ImageDetailTreeItem> {
  constructor() { }

  private _onDidChangeTreeData: vscode.EventEmitter<ImageDetailTreeItem | undefined | null | void> = new vscode.EventEmitter<ImageDetailTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ImageDetailTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private _selectedImage: vscode.Uri | undefined;

  refresh = (): void => this._onDidChangeTreeData.fire();

  getTreeItem = (element: ImageDetailTreeItem): vscode.TreeItem => element;

  getChildren = async (element?: ImageDetailTreeItem): Promise<ImageDetailTreeItem[]> => {
    if (!this._selectedImage) {
      return [new ImageDetailTreeItem('No image selected', '', vscode.TreeItemCollapsibleState.None)];
    }

    try {
      const items: ImageDetailTreeItem[] = [];
      const stats = fs.statSync(this._selectedImage.fsPath);

      items.push(new ImageDetailTreeItem(ImageDetailTreeItemType.Name, path.basename(this._selectedImage.fsPath), vscode.TreeItemCollapsibleState.None));
      items.push(new ImageDetailTreeItem(ImageDetailTreeItemType.Path, path.dirname(this._selectedImage.fsPath), vscode.TreeItemCollapsibleState.None));
      items.push(new ImageDetailTreeItem(ImageDetailTreeItemType.Size, formatFileSize(stats.size), vscode.TreeItemCollapsibleState.None));
      items.push(new ImageDetailTreeItem(ImageDetailTreeItemType.Created, stats.birthtime.toLocaleString(), vscode.TreeItemCollapsibleState.None));
      items.push(new ImageDetailTreeItem(ImageDetailTreeItemType.Modified, stats.mtime.toLocaleString(), vscode.TreeItemCollapsibleState.None));

      return items;
    } catch (error) {
      return [new ImageDetailTreeItem(`Error: ${error}`, '', vscode.TreeItemCollapsibleState.None)];
    }
  };

  setSelectedImage = (uri: vscode.Uri | undefined): void => {
    this._selectedImage = uri;
    this.refresh();
  };

  getSelectedImage = (): vscode.Uri | undefined => this._selectedImage;
}