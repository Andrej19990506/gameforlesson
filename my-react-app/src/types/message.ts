export type MessageStatus = 'sending' | 'sent' | 'error'

export interface Reaction {
    emoji: string
    userId: string
    createdAt: string
}

export interface Message {
    _id: string
    text: string
    image: string
    senderId: string
    receiverId: string
    seen: boolean
    createdAt: string
    status?: MessageStatus
    reactions?: Reaction[]
}

