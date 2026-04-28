import { customAlphabet } from 'nanoid'

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

export const generateSlug = customAlphabet(alphabet, 12)
export const generateInviteToken = customAlphabet(alphabet, 16)
