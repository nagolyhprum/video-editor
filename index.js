const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Endpoint for uploading a file
app.post('/upload/:pathname(*)', upload.single('file'), async (req, res) => {
    try {
        const from = path.join(__dirname, req.file.path);
        const to = path.join(__dirname, 'uploads', req.params.pathname);
        try {
            await fs.mkdir(path.dirname(to), { recursive: true });
        } catch(_) {
            // Ignore error if directory already exists
        }
        await fs.rename(from, to);
        res.status(200).json({ message: 'File uploaded successfully' });
    } catch(err) {
        return res.status(404).json({ error: err.message });
    }
});

// Endpoint for downloading a file
app.get('/download/:pathname(*)', async (req, res) => {
    try {
        const pathname = path.join(__dirname, 'uploads', req.params.pathname);
        res.download(pathname);
    } catch(err) {
        return res.status(404).json({ error: err.message });
    }
});
  
// Endpoint to list the contents of the "uploads" folder
app.get('/list/:pathname(*)?', async (req, res) => {
    try {
        const pathname = path.join(__dirname, 'uploads', req.params.pathname ?? "");
        const data = await fs.readdir(pathname);
        res.status(200).json({ data });        
    } catch(err) {        
        return { data : [] }
    }
});

app.use(express.static(path.join(__dirname, 'public')));

const port = 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});