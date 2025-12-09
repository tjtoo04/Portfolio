export enum Commands {
  CLEAR = 'clear',
  CLS = 'cls',
  HELP = 'help',
  QUESTION = '?',
  LS = 'ls',
  CD = 'cd',
  CAT = 'cat'
}

interface CommandInfo {
  description: string;
  alias?: Commands;
}

export const COMMAND_DESCRIPTIONS: Record<Commands, CommandInfo> = {
  [Commands.CLEAR]: {
    description: 'Clears the terminal screen of all previous output and commands.',
    alias: Commands.CLS
  },
  [Commands.CLS]: {
    description: 'Clears the terminal screen of all previous output and commands (alias for clear).',
    alias: Commands.CLEAR
  },
  [Commands.HELP]: {
    description: 'Displays a list of all available commands and their descriptions.',
    alias: Commands.QUESTION
  },
  [Commands.QUESTION]: {
    description: 'Displays a list of all available commands and their descriptions (alias for help).',
    alias: Commands.HELP
  },
  [Commands.LS]: {
    description: 'Displays the list of directories available from the current directory.',
  },
  [Commands.CD]: {
    description: 'Changes the current directory to the selected directory.',
  },
  [Commands.CAT]: {
    description: 'Outputs the content of a specified file to the terminal.'
  },
};

export interface PathNode {
  name: string;
  type: 'dir' | 'file';
  children?: { [key: string]: PathNode }; // Key is the name for quick lookup
  content?: string; // For 'file' type nodes
}

export interface FileSystem {
  root: PathNode;
}
