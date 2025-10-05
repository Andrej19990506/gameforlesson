import { ChatContext } from "../../context/ChatContext"
import ChatContainer from "../components/ChatContainer"
import RightSidebar from "../components/RightSidebar"
import Sidebar from "../components/Sidebar"
import { useContext, useState } from "react"
import type { ChatContextType } from "../../context/ChatContext"

const HomePage = () => {
  const {selectedUser} = useContext(ChatContext) as ChatContextType
  const [showRightSidebar, setShowRightSidebar] = useState(false)

  return (
    <div className='border w-full h-screen sm:px-[13%] sm:py-[3%] max-md:border-none max-md:p-0'>
      <div className = {`backdrop-blur-xl border-2 border-gray-600 rounded-2xl overflow-hidden h-[100%] grid grid-cols-1 relative max-md:rounded-none max-md:border-none ${selectedUser ? 'md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]' : 'md:grid-cols-2'}`}>
        <Sidebar/>
        <ChatContainer onToggleRightSidebar={() => setShowRightSidebar(!showRightSidebar)}/>
        {/* На десктопе всегда показываем RightSidebar, на мобильных только при showRightSidebar */}
        <div className="hidden md:block">
          <RightSidebar/>
        </div>
        {showRightSidebar && (
          <div 
            className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50"
            onClick={() => setShowRightSidebar(false)}
          >
            <div 
              className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
              onClick={(e) => e.stopPropagation()}
            >
              <RightSidebar onClose={() => setShowRightSidebar(false)}/>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HomePage