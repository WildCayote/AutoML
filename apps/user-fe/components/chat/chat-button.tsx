// "use client"

// import { useState } from "react"
// import { MessageSquare } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

// export function ChatButton() {
//   const [open, setOpen] = useState(false)

//   return (
//     <Sheet open={open} onOpenChange={setOpen}>
//       <SheetTrigger asChild>
//         <Button
//           size="icon"
//           className="h-12 w-12 rounded-full fixed bottom-6 right-6 shadow-lg bg-blue-600 hover:bg-blue-700"
//         >
//           <MessageSquare className="h-6 w-6 text-white" />
//         </Button>
//       </SheetTrigger>
//       <SheetContent className="w-[400px] sm:w-[540px]">
//         <SheetHeader>
//           <SheetTitle>AI Assistant</SheetTitle>
//         </SheetHeader>
//         <div className="py-6">
//           <div className="space-y-4">
//             <div className="bg-blue-50 p-3 rounded-lg rounded-tl-none max-w-[80%]">
//               <p className="text-sm">
//                 Hello! I'm your AI assistant. How can I help you with your AutoML project today?
//               </p>
//             </div>

//             <div className="flex justify-end">
//               <div className="bg-gray-100 p-3 rounded-lg rounded-tr-none max-w-[80%]">
//                 <p className="text-sm">
//                   This is a placeholder for the chat interface. In a real implementation, you would be able to interact
//                   with the AI assistant here.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </SheetContent>
//     </Sheet>
//   )
// }