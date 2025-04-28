import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";

function Notes() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editFormData, setEditFormData] = useState({ title: "", description: "" });

  // Filters
  const [searchTitle, setSearchTitle] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const notesPerPage = 5;

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get("/notes", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(response.data);
    } catch (err) {
      console.error(err);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleEditChange = (e) => {
    setEditFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);

      // IMPORTANT: Only send title and description!
      await axios.post(
        "/notes",
        {
          title: formData.title,
          description: formData.description
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      await fetchNotes();
      setFormData({ title: "", description: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to create note. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (id) => {
    const token = localStorage.getItem("token");

    try {
      setLoading(true);
      await axios.delete(`/notes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await fetchNotes();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditNote = (note) => {
    setEditingNoteId(note.id);
    setEditFormData({ title: note.title, description: note.description });
  };

  const handleUpdateNote = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      setLoading(true);
      await axios.put(
        `/notes/${editingNoteId}`,
        {
          title: editFormData.title,
          description: editFormData.description
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      await fetchNotes();
      setEditingNoteId(null);
      setEditFormData({ title: "", description: "" });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleSearch = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);

      let query = `/notes?title=${searchTitle}`;
      if (fromDate) {
        query += `&fromDate=${fromDate}`;
      }
      if (endDate) {
        query += `&endDate=${endDate}`;
      }

      const response = await axios.get(query, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotes(response.data);
      setCurrentPage(1); // Reset to first page after search
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTitle("");
    setFromDate("");
    setEndDate("");
    fetchNotes();
  };

  // Pagination Helpers
  const indexOfLastNote = currentPage * notesPerPage;
  const indexOfFirstNote = indexOfLastNote - notesPerPage;
  const currentNotes = notes.slice(indexOfFirstNote, indexOfLastNote);
  const totalPages = Math.ceil(notes.length / notesPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  if (loading) return <p className="text-center mt-10 text-lg font-semibold">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Notes</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
        >
          Logout
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-md shadow-md mb-6">
        <div className="flex flex-col md:flex-row md:space-x-4 mb-4">
          <input
            type="text"
            placeholder="Search by title..."
            value={searchTitle}
            onChange={(e) => setSearchTitle(e.target.value)}
            className="border p-2 rounded-md flex-1 mb-2 md:mb-0"
          />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border p-2 rounded-md"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border p-2 rounded-md"
          />
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Search
          </button>
          <button
            onClick={handleClearFilters}
            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Create Note */}
      <form onSubmit={handleCreateNote} className="bg-white p-4 rounded-md shadow-md mb-6">
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded-md mb-2"
        />
        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded-md mb-2"
        ></textarea>
        <button
          type="submit"
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
        >
          Create Note
        </button>
      </form>

      {/* Notes List */}
      {currentNotes.map((note) => (
        <div key={note.id} className="bg-white p-4 rounded-md shadow-md mb-4">
          {editingNoteId === note.id ? (
            <form onSubmit={handleUpdateNote}>
              <input
                type="text"
                name="title"
                value={editFormData.title}
                onChange={handleEditChange}
                className="w-full border p-2 rounded-md mb-2"
              />
              <textarea
                name="description"
                value={editFormData.description}
                onChange={handleEditChange}
                className="w-full border p-2 rounded-md mb-2"
              ></textarea>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingNoteId(null)}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <h3 className="text-xl font-bold">{note.title}</h3>
              <p className="text-gray-700">{note.description}</p>
              <small className="block text-gray-500 mb-2">
                Created: {new Date(note.createdAt).toLocaleString()}
              </small>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditNote(note)}
                  className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-md"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      {/* Pagination Controls */}
      <div className="flex justify-center space-x-4 mt-6">
        <button
          onClick={prevPage}
          disabled={currentPage === 1}
          className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={nextPage}
          disabled={currentPage === totalPages}
          className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Notes;