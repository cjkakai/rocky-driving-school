import request from "./client";

export const broadcastSMS = (student_ids, message) =>
  request("/api/sms/broadcast/", {
    method: "POST",
    body: JSON.stringify({ student_ids, message }),
  });
