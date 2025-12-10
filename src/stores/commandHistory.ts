import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'

export const useCommandHistoryStore = defineStore('history', () => {
  const history: Ref<string[]> = ref([])
  let pointer: Ref<number> = ref(0)

  const addHistory = (command: string) => { history.value.push(command); pointer.value = history.value.length }

  const traverseHistory = (direction: string) => {
    if (direction == "up") {
      if (pointer.value <= 0) {
        pointer.value = 0
      } else {

        pointer.value -= 1
      }
    } else if (direction == "down") {
      if (pointer.value + 1 > history.value.length) {
        pointer.value = history.value.length
      } else {
        pointer.value += 1

      }
    }
  }

  const getHistory = () => history.value[pointer.value]

  return { history, addHistory, traverseHistory, getHistory }
})
