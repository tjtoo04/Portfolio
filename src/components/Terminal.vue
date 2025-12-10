<script setup lang="ts">
import { useCommandHistoryStore } from '@/stores/commandHistory'
import { COMMAND_DESCRIPTIONS, Commands, type FileSystem } from '@/types'
import { TerminalPath } from '@/utils/TerminalPath'
import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import * as fileSystemData from '../filesystem.json'

const historyStore = useCommandHistoryStore()
const termPrompt: string = '❯ '
const currentLine = defineModel<string>()
const completionsPointer: Ref<number> = ref(0)

const INITIAL_FS: FileSystem = fileSystemData as FileSystem

const terminal = new TerminalPath(INITIAL_FS)
const currentPath = ref(terminal.getCurrentPath())

const resetCompletionsPointer = () => (completionsPointer.value = 0)

const handleKeyPress = (event: KeyboardEvent) => {
  // Traverse commands history
  if (event.key == 'ArrowUp') {
    event.preventDefault()
    historyStore.traverseHistory('up')
    currentLine.value = historyStore.getHistory() || ''
    resetCompletionsPointer()
    return
  } else if (event.key == 'ArrowDown') {
    event.preventDefault()
    historyStore.traverseHistory('down')
    currentLine.value = historyStore.getHistory() || ''
    resetCompletionsPointer()
    return
  }

  if (event.key == 'Tab') {
    event.preventDefault()
    triggerCompletions()
  }

  if (event.key == 'Enter') {
    resetCompletionsPointer()
    const mainTermContainer = document.querySelector('.main-terminal-container')
    if (!mainTermContainer) return

    const latestPromptDiv = mainTermContainer.lastChild
    if (!latestPromptDiv) return

    const copyDiv = createLatestPromptDiv()
    if (!copyDiv) return

    // Get prompt value, save to history, then reset prompt
    if (!currentLine.value) return
    const value = currentLine.value.split(' ')[0]
    const args = currentLine.value.split(' ').slice(1)
    historyStore.addHistory(currentLine.value)
    currentLine.value = ''

    // Insert before new prompt
    mainTermContainer.insertBefore(copyDiv, latestPromptDiv)

    // Perform function
    const result = runCommand(value!.trim(), args)

    const resultDiv = document.createElement('div')
    resultDiv.style.whiteSpace = 'pre-wrap'
    resultDiv.style.marginTop = '0.2rem'
    resultDiv.style.marginBottom = '0.2rem'
    resultDiv.textContent = result

    // Insert Result
    mainTermContainer.insertBefore(resultDiv, latestPromptDiv)

    return
  }
}

const triggerCompletions = () => {
  const userInput = currentLine.value?.split(' ')
  if (!userInput || userInput.length < 2) {
    const availableCommands = Object.values(Commands)
    let commands: string[] = []

    availableCommands.map((key) => commands.push(key))
    appendAutocompletionSuggestions(commands.join('\t'))

    return
  } else {
    // Only provide autosuggestions for last argument inputted
    const argsArr = userInput!.slice(1)
    const argForAutoSuggestion = argsArr[argsArr.length - 1]

    const pathList = runCommand(Commands.LS).split('\t')
    const filteredSuggestions = pathList.filter((item) => {
      return item.includes(argForAutoSuggestion!)
    })

    if (filteredSuggestions.length > 1) {
      appendAutocompletionSuggestions(filteredSuggestions.join('\t'))
    } else {
      currentLine.value = `${userInput[0]!} ${filteredSuggestions[0]}`
    }
  }
}

const isCommandEnum = (value: string): value is Commands => {
  return Object.values(Commands).includes(value as Commands)
}

const runCommand = (command: string, args: string[] = []): string => {
  if (!isCommandEnum(command))
    return 'Command not found. Type `help` or `?` for list of available commands.'

  if (command == Commands.CLEAR || command == Commands.CLS) {
    // Clear all children except last
    const mainTermContainer = document.querySelector('.main-terminal-container')
    if (!mainTermContainer) return 'Error'

    while (mainTermContainer.childNodes.length > 1) {
      const firstChild = mainTermContainer.firstChild
      if (!firstChild) return 'Error'

      mainTermContainer.removeChild(firstChild)
    }
    return ''
  } else if (command == Commands.HELP || command == Commands.QUESTION) {
    let commandsInfo = 'Available Commands:\n\n'

    for (const commandKey in COMMAND_DESCRIPTIONS) {
      const info = COMMAND_DESCRIPTIONS[commandKey as Commands]

      if (commandKey === Commands.CLS || commandKey === Commands.QUESTION) {
        continue
      }

      const aliasText = info.alias ? ` (Alias: ${info.alias})` : ''

      commandsInfo += `  ${commandKey}${aliasText}\n`
      commandsInfo += `  > ${info.description}\n\n`
    }

    return commandsInfo.trim()
  } else if (command == Commands.CD) {
    if (args.length < 1) return 'Path not provided'
    if (terminal.cd(args[0]!)) {
      currentPath.value = terminal.getCurrentPath()
      return ''
    } else {
      return 'Invalid Path'
    }
  } else if (command == Commands.LS) {
    return terminal.ls()
  } else if (command == Commands.CAT) {
    if (args.length < 1) {
      return 'cat: Missing file path. Specify a file path.'
    }
    const output = terminal.cat(args[0]!)

    if (output.title != '') {
      appendTitle(output.title)
    }

    if (output.url != '') {
      appendLink(output.url)
    }

    return output.content
  }
  return ''
}

const focusInput = () => {
  const inputField = document.getElementById('term-input') as HTMLElement
  if (!inputField) {
    alert('Something is wrong!')
    return
  }

  inputField.focus()
}

const createLatestPromptDiv = () => {
  const mainTermContainer = document.querySelector('.main-terminal-container')
  if (!mainTermContainer) return

  const latestPromptDiv = mainTermContainer.lastChild
  if (!latestPromptDiv) return

  const copyDiv = latestPromptDiv.cloneNode()
  const copyChildren = latestPromptDiv.childNodes

  for (let index = 0; index < copyChildren.length; index++) {
    const element = copyChildren[index]
    if (!element) return

    if (index == copyChildren.length - 1) {
      const elementText = currentLine.value
      const childClone = document.createElement('div')

      childClone.style.whiteSpace = 'pre-wrap'
      childClone.style.marginTop = '0.2rem'
      childClone.style.marginBottom = '0.2rem'
      childClone.style.marginLeft = '0.5rem'

      childClone.textContent = elementText!
      copyDiv.appendChild(childClone)
    } else {
      const elementText = element.textContent
      const childClone = element.cloneNode()
      childClone.textContent = elementText
      copyDiv.appendChild(childClone)
    }
  }

  return copyDiv
}

const appendAutocompletionSuggestions = (text: string) => {
  const suggestionDiv = document.createElement('div')

  suggestionDiv.textContent = text
  suggestionDiv.classList.add(`suggestions`)

  const mainTermContainer = document.querySelector('.main-terminal-container')
  const lastEl = mainTermContainer?.lastChild
  const copyDiv = createLatestPromptDiv()

  mainTermContainer?.insertBefore(copyDiv!, lastEl!)
  mainTermContainer?.insertBefore(suggestionDiv, lastEl!)
}

const appendTitle = (title: string) => {
  const titleDiv = document.createElement('div')
  const bold = document.createElement('b')

  bold.textContent = '|~~ ' + title + ' ~~|'
  titleDiv.style.fontSize = '32px'
  titleDiv.appendChild(bold)

  const mainTermContainer = document.querySelector('.main-terminal-container')
  const lastEl = mainTermContainer?.lastChild

  mainTermContainer?.insertBefore(titleDiv, lastEl!)
}

const appendLink = (url: string) => {
  const linkDiv = document.createElement('div')
  const linkText = document.createElement('span')
  const linkEl = document.createElement('a')

  linkEl.textContent = url + '\n\n'
  linkEl.href = url
  linkEl.target = '_blank'

  linkText.textContent = '\nGithub Link: '

  linkDiv.style.whiteSpace = 'pre-wrap'
  linkDiv.style.marginTop = '0.2rem'
  linkDiv.style.marginBottom = '0.2rem'
  linkDiv.appendChild(linkText)
  linkDiv.appendChild(linkEl)

  const mainTermContainer = document.querySelector('.main-terminal-container')
  const lastEl = mainTermContainer?.lastChild

  mainTermContainer?.insertBefore(linkDiv, lastEl!)
}

onMounted(() => {
  setTimeout(() => {
    document.querySelector('.main-terminal-container')?.classList.add('is-ready')
    focusInput()
    document.addEventListener('keydown', handleKeyPress)
  }, 500)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyPress)
})
</script>

<template>
  <div @click="focusInput" class="main-terminal-container">
    <div>
      Welcome to my Termfolio (Terminal Portfolio)! Start by typing `help` or `?` to view the list
      of available commands.
    </div>
    <div class="term-prompt-div">
      <div class="prompt-text">{{ currentPath }} {{ termPrompt }}</div>
      <input v-model="currentLine" id="term-input" class="input-text" type="text" />
    </div>
  </div>
</template>

<style scoped>
.main-terminal-container.is-ready {
  transform: scale(1);
}

.main-terminal-container {
  display: flex;
  flex-direction: column;
  background-color: black;
  border-radius: 1rem;
  width: 80dvw;
  height: 80dvh;
  padding: 1rem;
  font-family: monospace;

  position: relative;

  transition: transform 0.6s ease-out;

  transform: scale(0);
}

.term-prompt-div {
  display: flex;
  align-items: center;
  background-color: transparent;
}

.prompt-text {
  display: flex;
  width: 100%;
  max-width: fit-content;
}

.term-output {
  white-space: pre-wrap;
  margin-top: 0.5rem;
}

.input-text {
  width: 100%;
  margin-left: 0.5rem;
  background: transparent;
  border: none;
  caret-color: oklch(0.9362 0 272);
  caret-shape: block;
  color: oklch(0.9362 0 272);
}

.input-text:focus {
  outline: none;
}

.cursor-block {
  margin-left: 0.1rem;
}

@keyframes blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.blinking {
  animation: blink 1s steps(1, start) infinite;
}
</style>
