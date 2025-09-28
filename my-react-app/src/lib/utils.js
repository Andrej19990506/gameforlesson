export function formatMessageTime(date) {
    return new Date(date).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    })
}

export function formatLastSeen(lastSeen) {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
    
    // Проверяем, тот же ли день
    const isToday = now.toDateString() === lastSeenDate.toDateString();
    const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === lastSeenDate.toDateString();
    
    if (diffInMinutes < 5) {
        return "недавно";
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes} мин назад`;
    } else if (diffInMinutes < 120) { // 2 часа
        return `${Math.floor(diffInMinutes / 60)} ч назад`;
    } else if (isToday) {
        return `была сегодня в ${lastSeenDate.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}`;
    } else if (isYesterday) {
        return `была вчера в ${lastSeenDate.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}`;
    } else {
        return `была ${lastSeenDate.toLocaleDateString('ru-RU')} в ${lastSeenDate.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}`;
    }
}