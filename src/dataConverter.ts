import * as vscode from "vscode";
import QuickPickItem from "./interface/quickPickItem";
import WorkspaceData from "./interface/workspaceData";
import Utils from "./utils";
import Item from "./interface/item";
import Config from "./config";

class DataConverter {
  constructor(private utils: Utils, private config: Config) {}

  convertToQpData(data: WorkspaceData): QuickPickItem[] {
    return this.mapDataToQpData(data.items);
  }

  getItemFilterPhraseForKind(kind: number): string {
    const itemsFilterPhrases = this.config.getItemsFilterPhrases();
    return itemsFilterPhrases[kind] as string;
  }

  private mapDataToQpData(data: Map<string, Item>): QuickPickItem[] {
    const qpData: QuickPickItem[] = [];

    data.forEach((item: Item) => {
      item.elements.forEach((element: vscode.Uri | vscode.DocumentSymbol) => {
        qpData.push(this.mapItemElementToQpItem(item.uri, element));
      });
    });
    return qpData;
  }

  private mapItemElementToQpItem(
    uri: vscode.Uri,
    item: vscode.DocumentSymbol | vscode.Uri
  ): QuickPickItem {
    if (item.hasOwnProperty("range")) {
      item = item as vscode.DocumentSymbol;
      return this.mapDocumentSymbolToQpItem(uri, item);
    } else {
      item = item as vscode.Uri;
      return this.mapUriToQpItem(item);
    }
  }

  private mapDocumentSymbolToQpItem(
    uri: vscode.Uri,
    symbol: vscode.DocumentSymbol
  ): QuickPickItem {
    const splitter = this.utils.getSplitter();
    const icons = this.config.getIcons();
    const symbolName = symbol.name.split(splitter);
    const parent = symbolName.length === 2 ? symbolName[0] : "";
    const name = symbolName.length === 2 ? symbolName[1] : symbol.name;
    const icon = icons[symbol.kind] ? `$(${icons[symbol.kind]})` : "";
    const label = icon ? `${icon}  ${name}` : name;

    const itemFilterPhrase = this.getItemFilterPhraseForKind(symbol.kind);

    const description = `${
      itemFilterPhrase ? `[${itemFilterPhrase}${name}] ` : ""
    }${vscode.SymbolKind[symbol.kind]} at ${
      symbol.range.isSingleLine
        ? `line: ${symbol.range.start.line + 1}`
        : `lines: ${symbol.range.start.line + 1} - ${symbol.range.end.line}${
            parent ? ` in ${parent}` : ""
          }`
    }`;

    return {
      uri,
      symbolKind: symbol.kind,
      range: {
        start: symbol.range.start,
        end: symbol.range.end,
      },
      label,
      detail: this.normalizeUriPath(uri.fsPath),
      description,
    };
  }

  private mapUriToQpItem(uri: vscode.Uri): QuickPickItem {
    const symbolKind = 0;
    const icons = this.config.getIcons();
    const name = uri.path.split("/").pop();
    const icon = icons[symbolKind] ? `$(${icons[symbolKind]})` : "";
    const label = icon ? `${icon}  ${name}` : name;

    const start = new vscode.Position(0, 0);
    const end = new vscode.Position(0, 0);

    const itemFilterPhrase = this.getItemFilterPhraseForKind(symbolKind);

    const description = `${
      itemFilterPhrase ? `[${itemFilterPhrase}${name}] ` : ""
    }File`;

    return {
      uri,
      symbolKind,
      range: {
        start,
        end,
      },
      label,
      detail: this.normalizeUriPath(uri.fsPath),
      description,
    } as QuickPickItem;
  }

  private normalizeUriPath(path: string): string {
    const workspaceFoldersPaths = this.getWorkspaceFoldersPaths();
    let normalizedPath = path;
    workspaceFoldersPaths.forEach((wfPath: string) => {
      normalizedPath = normalizedPath.replace(wfPath, "");
    });

    return normalizedPath;
  }

  private getWorkspaceFoldersPaths(): string[] {
    return (
      (vscode.workspace.workspaceFolders &&
        vscode.workspace.workspaceFolders.map(
          (wf: vscode.WorkspaceFolder) => wf.uri.fsPath
        )) ||
      []
    );
  }
}

export default DataConverter;
