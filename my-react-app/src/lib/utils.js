export function formatMessageTime(date) {
    return new Date(date).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    })
}

export function formatLastSeen (lastSeen) {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen)
    const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60))
    if (diffInMinutes < 5) {
       return "недавно";
   } else if (diffInMinutes < 60) {
       return `${diffInMinutes} мин назад`;
   } else if (diffInMinutes < 1440) { // 24 часа
       return `${Math.floor(diffInMinutes / 60)} ч назад`;
   } else {
       return lastSeenDate.toLocaleDateString();
   }
}