import React, { useState, useEffect } from "react";
import { GalleryIcon, RemoveIcon, UploadFile } from "@nudmcdgnpm/digit-ui-react-components";
import { useTranslation } from "react-i18next";

function UploadDrawer({ setProfilePic, closeDrawer, userType, removeProfilePic ,showToast}) {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [file, setFile] = useState("");
  const [error, setError] = useState(null);
  const [fileChecksum, setFileChecksum] = useState(null);
  const { t } = useTranslation();

  const selectfile = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const removeimg = () => {
    removeProfilePic();
    closeDrawer();
  };

  const onOverlayBodyClick = () => closeDrawer();

  // 🔐 SHA-256 checksum
  const calculateChecksum = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result;
          const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
          resolve(hashHex);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // ✅ Secure filename validation (underscore allowed)
  const isValidFile = (file) => {
    const allowedExtensions = [".jpg", ".jpeg", ".png"];
    const fileName = file.name.toLowerCase();

    if (!fileName || fileName.trim() === "" || fileName === "null") return false;

    // Extension check
    const isValidExtension = allowedExtensions.some((ext) => fileName.endsWith(ext));

    // Security checks
    const hasDoubleExtension = fileName.split(".").length > 2;
    const hasDoubleDot = fileName.includes("..");
    const hasNullByte = fileName.includes("%00");
    const hasMetaChars = /[\x00-\x1F\x7F]/.test(fileName);

    /**
     * Allowed characters:
     * a-z 0-9 _ - . space ( )
     */
    const hasSpecialChars = /[^a-z0-9_\-\. ()]/.test(fileName);

    return (
      isValidExtension &&
      !hasDoubleExtension &&
      !hasDoubleDot &&
      !hasNullByte &&
      !hasMetaChars &&
      !hasSpecialChars
    );
  };

  useEffect(() => {
    (async () => {
      if (!file) return;

      setError(null);
      setFileChecksum(null);

      // Size validation
      if (file.size >= 1000000) {
        showToast("error", t("CORE_COMMON_PROFILE_MAXIMUM_UPLOAD_SIZE_EXCEEDED"));
        setError(t("CORE_COMMON_PROFILE_MAXIMUM_UPLOAD_SIZE_EXCEEDED"));
        return;
      }

      // Filename validation
      if (!isValidFile(file)) {
        showToast("error", t("CORE_COMMON_PROFILE_INVALID_FILE_EXTENSION"));
        setError(t("CORE_COMMON_PROFILE_INVALID_FILE_EXTENSION"));
        return;
      }

      try {
        const checksum = await calculateChecksum(file);
        setFileChecksum(checksum);

        const response = await Digit.UploadServices.Filestorage(
          `${userType}-profile`,
          file,
          Digit.ULBService.getStateId(),
          checksum
        );

        if (response?.data?.files?.length > 0) {
          const fileStoreId = response.data.files[0].fileStoreId;
          setUploadedFile(fileStoreId);
          setProfilePic(fileStoreId);
          closeDrawer();
        } else {
          showToast("error", t("CORE_COMMON_PROFILE_FILE_UPLOAD_ERROR"));
          setError(t("CORE_COMMON_PROFILE_FILE_UPLOAD_ERROR"));
        }
      } catch (err) {
        console.error("Upload error:", err);
        showToast("error", t("CORE_COMMON_PROFILE_INVALID_FILE_INPUT"));
      }
    })();
  }, [file]);

  return (
    <React.Fragment>
      <div
        style={{
          position: "fixed",
          top: "0",
          left: "0",
          right: "0",
          bottom: "0",
          width: "100%",
          height: "100vh",
          backgroundColor: "rgba(0,0,0,.5)",
          // zIndex: "9998",
        }}
        onClick={onOverlayBodyClick}
      ></div>
      <div
        style={{
          width: "100%",
          justifyContent: "space-between",
          display: "flex",
          backgroundColor: "white",
          alignItems: "center",
          position: "fixed",
          left: "0",
          right: "0",
          height: "20%",
          bottom: userType === "citizen" ? "2.5rem" : "0",
          zIndex: "2",
        }}
      >
        <div
          style={{ display: "flex", flex: "1", flexDirection: "column", width: "100%", justifyContent: "center", alignItems: "center", gap: "8px 0" }}
        >
          <label for="file" style={{ cursor: "pointer" }}>
            {" "}
            <GalleryIcon />
          </label>
          <label style={{ cursor: "pointer" }}> Gallery</label>
          <input type="file" id="file" accept="image/*, .png, .jpeg, .jpg" onChange={selectfile} style={{ display: "none" }} />
        </div>

        <div
          style={{ display: "flex", flex: "1", width: "100%", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: "8px 0" }}
        >
          <button onClick={removeimg}>
            <RemoveIcon />
          </button>
          <label style={{ cursor: "pointer" }}>Remove</label>
        </div>
      </div>
    </React.Fragment>
  );
}

export default UploadDrawer;
