import * as vscode from 'vscode';
import { SimilarImageTreeItem } from './similar-image-tree-item';
import { SimilarImage } from '../../commands/find-similar-images';

export class SimilarImageTreeItemsTreeDataProvider implements vscode.TreeDataProvider<SimilarImageTreeItem> {
  constructor() { }

  private _onDidChangeTreeData: vscode.EventEmitter<SimilarImageTreeItem | undefined | null | void> = new vscode.EventEmitter<SimilarImageTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<SimilarImageTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private similarImages: SimilarImage[] = [];

  refresh = (): void => this._onDidChangeTreeData.fire();

  getTreeItem = (element: SimilarImageTreeItem): vscode.TreeItem => element;

  getChildren = async (element?: SimilarImageTreeItem): Promise<SimilarImageTreeItem[]> => {
    if (!this.similarImages) {
      return [new SimilarImageTreeItem('No image selected', '', vscode.TreeItemCollapsibleState.None, vscode.Uri.file(''))];
    }

    try {
      return this.similarImages.map(similarImage =>
        new SimilarImageTreeItem(
          similarImage.uri.fsPath,
          similarImage.similarity.toString(),
          vscode.TreeItemCollapsibleState.None,
          similarImage.uri,
          {
            command: 'image-explorer.openImage',
            title: 'Open Image',
            arguments: [similarImage.uri]
          }
        )
      );
    } catch (error) {
      return [new SimilarImageTreeItem(`Error: ${error}`, '', vscode.TreeItemCollapsibleState.None, vscode.Uri.file(''))];
    }
  };

  setSimilarImages = (similarImages: SimilarImage[]): void => {
    this.similarImages = similarImages;
    this.refresh();
  };

  getSimilarImages = (): SimilarImage[] => this.similarImages;
}