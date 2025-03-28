import * as vscode from 'vscode';

export const refreshAllViews = (providers: vscode.TreeDataProvider<any>[]) => {
  providers.forEach(provider => {
    if (typeof (provider as any).refresh === 'function') {
      (provider as any).refresh();
    }
  });
};
