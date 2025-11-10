"use client";

import { useState } from "react";
import axios from "axios";

export default function AdminPage() {
  const [eventName, setEventName] = useState("");
  const [file, setFile] = useState(null);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8080/api/events", { name: eventName });
      setEventName("");
      alert("Event created successfully!");
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Error creating event");
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      // Assuming event ID 1 for now
      await axios.post("http://localhost:8080/api/results/upload/1", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setFile(null);
      alert("File uploaded successfully!");
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file");
    }
  };

  return (
    <div>
      <h1>Admin</h1>
      <h2>Create Event</h2>
      <form onSubmit={handleCreateEvent}>
        <label htmlFor="eventName">Event Name:</label>
        <input
          type="text"
          id="eventName"
          name="eventName"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
        />
        <button type="submit">Create</button>
      </form>

      <h2>Upload Times</h2>
      <form onSubmit={handleUploadFile}>
        <label htmlFor="file">File:</label>
        <input
          type="file"
          id="file"
          name="file"
          onChange={(e) => setFile((e.target.files as any)[0])}
        />
        <button type="submit">Upload</button>
      </form>
    </div>
  );
}
