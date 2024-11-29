import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import axios from "axios";
import API_PATHS from "../../../../../constants/apiPaths";

type CSVFileImportProps = {
  title: string;
};

type Headers = {
  Authorization?: string;
};

export default function CSVFileImport({ title }: CSVFileImportProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const tokenRequestUrl = API_PATHS.import;

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFile(file);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const uploadFile = async () => {
    if (!file) {
      console.error("Cannot find file for upload");
      return;
    }

    if (!tokenRequestUrl) {
      console.error("Missing token request URL");
      return;
    }

    const authorization_token = localStorage.getItem("authorization_token");
    const headers: Headers = {};

    if (authorization_token) {
      headers.Authorization = `Basic ${authorization_token}`;
    }

    // Get the presigned URL
    const presignedUrlResponse = await axios({
      method: "GET",
      url: tokenRequestUrl,
      params: {
        name: encodeURIComponent(file.name),
      },
      headers,
    });
    const presignedUrl = presignedUrlResponse.data.sasUrl;
    console.log("File to upload: ", file.name);
    console.log("Uploading to: ", presignedUrl);
    const result = await fetch(presignedUrl, {
      headers: {
        "x-ms-blob-type": "BlockBlob",
      },
      method: "PUT",
      body: file,
    });
    console.log("Result: ", result);
    setFile(null);
  };
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {!file ? (
        <input type="file" onChange={onFileChange} />
      ) : (
        <div>
          <button onClick={removeFile}>Remove file</button>
          <button onClick={uploadFile}>Upload file</button>
        </div>
      )}
    </Box>
  );
}
