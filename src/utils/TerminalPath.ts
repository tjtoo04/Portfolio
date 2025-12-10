import type { PathNode, FileSystem } from "@/types";

export class TerminalPath {
  private fileSystem: FileSystem;
  private currentPath: string[] = [];

  constructor(initialFileSystem: FileSystem) {
    this.fileSystem = initialFileSystem;
  }

  /**
   * @returns The current working directory as a string (e.g., /home/user)
   */
  public getCurrentPath(): string {
    if (this.currentPath.length === 0) {
      return '/'; // Root path
    }
    return '/' + this.currentPath.join('/');
  }

  /**
   * Finds the PathNode object for a given path array.
   * @param pathArray The path components to traverse.
   * @returns The PathNode, or undefined if not found.
   */
  private getNode(pathArray: string[]): PathNode | undefined {
    let currentNode = this.fileSystem.root;

    for (const name of pathArray) {
      if (currentNode.type !== 'dir' || !currentNode.children) {
        return undefined; // Cannot traverse a non-directory
      }
      const nextNode = currentNode.children[name];
      if (!nextNode) {
        return undefined; // Directory component not found
      }
      currentNode = nextNode;
    }
    return currentNode;
  }

  /**
   * @returns The PathNode object representing the current working directory.
   */
  private getCurrentNode(): PathNode {
    // The current node is guaranteed to exist and be a directory
    // because we only update currentPath in the successful 'cd' method.
    return this.getNode(this.currentPath) || this.fileSystem.root;
  }

  /**
   * Implements the 'ls' command logic.
   * @returns A string containing the names of all items in the current directory, separated by spaces.
   */
  public ls(): string {
    const currentNode = this.getCurrentNode();

    if (currentNode.type !== 'dir' || !currentNode.children) {
      return '';
    }

    const childNames = Object.values(currentNode.children);
    let names: string[] = []
    childNames.map(key => names.push(key.type == 'dir' ? '/' + key.name : key.name))

    return names.join('\t');
  }

  /**
   * Implements the 'cd' command logic.
   * @param targetPath The path string provided by the user (e.g., '..', 'documents', '/etc/config')
   * @returns true if the path was successfully changed, false otherwise.
   */
  public cd(targetPath: string): boolean {
    let newPathComponents: string[];

    if (targetPath.startsWith('/')) {
      newPathComponents = [];
      targetPath = targetPath.substring(1); // Remove the leading '/'
    } else {
      newPathComponents = [...this.currentPath];
    }

    // Process each component of the target path
    const segments = targetPath.split('/').filter(s => s.length > 0);

    for (const segment of segments) {
      if (segment === '..') {
        // Traverse up one level, but stop at the root
        if (newPathComponents.length > 0) {
          newPathComponents.pop();
        }
      } else if (segment === '.') {
        // Current directory (do nothing)
        continue;
      } else {
        // Regular directory name
        newPathComponents.push(segment);
      }
    }

    // Validate final resolved path
    const targetNode = this.getNode(newPathComponents);

    if (targetNode && targetNode.type === 'dir') {
      // Path is valid and points to a directory.
      this.currentPath = newPathComponents;
      return true;
    }

    // Path is invalid or points to a file.
    return false;
  }

  /**
   * Implements the 'cat' command logic.
   * @param targetPath The path string provided by the user (e.g., 'about-me.md')
   * @returns The content of the file, or an error message if the path is invalid or is a directory.
   */
  public cat(targetPath: string): { title: string, content: string, url: string } {
    let fullPathComponents: string[];

    if (targetPath.startsWith('/')) {
      fullPathComponents = [];
      targetPath = targetPath.substring(1);
    } else {
      fullPathComponents = [...this.currentPath]; // CRITICAL FIX: Use CWD as base
    }

    // Process path segments (e.g., handling '..', '.', and normal segments)
    const segments = targetPath.split('/').filter(s => s.length > 0);

    for (const segment of segments) {
      if (segment === '..') {
        if (fullPathComponents.length > 0) {
          fullPathComponents.pop();
        }
      } else if (segment === '.') {
        continue;
      } else {
        fullPathComponents.push(segment);
      }
    }

    const targetNode = this.getNode(fullPathComponents);

    if (!targetNode) {
      return { title: '', content: `cat: ${targetPath}: No such file or directory`, url: '' }
    }

    if (targetNode.type === 'dir') {
      return { title: '', content: `cat: ${targetPath}: Is a directory`, url: '' }
    }

    // return targetNode.content || '';
    return {
      title: targetNode.title!,
      content: targetNode.content || '',
      url: targetNode.link || ''
    }
  }

}
