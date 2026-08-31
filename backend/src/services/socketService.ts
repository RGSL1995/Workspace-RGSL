import { io, connectedUsers } from "../server";

export const emitNewEmails = (userId: string, newEmails: any[]) => {
  const socketId = connectedUsers.get(userId);

  if (socketId) {
    io.to(socketId).emit("new-emails", {
      count: newEmails.length,
      emails: newEmails,
      timestamp: new Date().toISOString(),
    });
    console.log(`📧 [SOCKET] Emitted ${newEmails.length} new emails to user ${userId}`);
  } else {
    console.log(`⚠️ [SOCKET] User ${userId} not connected, skipping notification`);
  }
};
