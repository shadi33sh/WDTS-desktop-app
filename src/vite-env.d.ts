/// <reference types="vite/client" />

declare interface FileSystemFileHandle {
  getFile(): Promise<File>;
  requestPermission(opts: { mode: string }): Promise<string>;
}

declare interface OpenFilePickerOptions {
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
  multiple?: boolean;
}

declare interface Window {
  showOpenFilePicker(opts?: OpenFilePickerOptions): Promise<FileSystemFileHandle[]>;
}
