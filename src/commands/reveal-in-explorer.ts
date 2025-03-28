import * as vscode from 'vscode';
import { ImageDetailTreeItemsTreeDataProvider } from "../providers/image-detail/image-detail-tree-items-tree-data-provider";

export const revealInExplorer = (provider: ImageDetailTreeItemsTreeDataProvider) => {
  const resource = provider.getSelectedImage();

  if (!resource) {
    vscode.window.showErrorMessage('No image selected');

    return;
  }

  vscode.commands.executeCommand('revealFileInOS', resource);
};