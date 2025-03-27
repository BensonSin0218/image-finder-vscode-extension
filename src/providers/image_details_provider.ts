import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { formatFileSize } from '../utils/file_size';
import { ImageDetailItem, ImageDetailItemContextType } from '../models/image_detail_item';

export class ImageDetailsProvider implements vscode.TreeDataProvider<ImageDetailItem> {
  constructor() { }

  private _onDidChangeTreeData: vscode.EventEmitter<ImageDetailItem | undefined | null | void> = new vscode.EventEmitter<ImageDetailItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ImageDetailItem | undefined | null | void> = this._onDidChangeTreeData.event;
  private _selectedImage: vscode.Uri | undefined;

  refresh = (): void => this._onDidChangeTreeData.fire();

  getTreeItem = (element: ImageDetailItem): vscode.TreeItem => element;

  getChildren = async (element?: ImageDetailItem): Promise<ImageDetailItem[]> => {
    if (!this._selectedImage) {
      return [new ImageDetailItem('No image selected', '', vscode.TreeItemCollapsibleState.None)];
    }

    try {
      const items: ImageDetailItem[] = [];
      const stats = fs.statSync(this._selectedImage.fsPath);

      items.push(new ImageDetailItem(ImageDetailItemContextType.Name, path.basename(this._selectedImage.fsPath), vscode.TreeItemCollapsibleState.None));
      items.push(new ImageDetailItem(ImageDetailItemContextType.Path, path.dirname(this._selectedImage.fsPath), vscode.TreeItemCollapsibleState.None));
      items.push(new ImageDetailItem(ImageDetailItemContextType.Size, formatFileSize(stats.size), vscode.TreeItemCollapsibleState.None));
      items.push(new ImageDetailItem(ImageDetailItemContextType.Created, stats.birthtime.toLocaleString(), vscode.TreeItemCollapsibleState.None));
      items.push(new ImageDetailItem(ImageDetailItemContextType.Modified, stats.mtime.toLocaleString(), vscode.TreeItemCollapsibleState.None));

      return items;
    } catch (error) {
      return [new ImageDetailItem(`Error: ${error}`, '', vscode.TreeItemCollapsibleState.None)];
    }
  };

  setSelectedImage = (uri: vscode.Uri | undefined): void => {
    this._selectedImage = uri;
    this.refresh();
  };

  getSelectedImage = (): vscode.Uri | undefined => this._selectedImage;
}