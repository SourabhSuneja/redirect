let selectedEmergency = null;
let picture = null; 
let name = null;
let contact = null;
let description = null;
let lat = null;
let long = null;

function openDialog(emergency) {
    selectedEmergency = emergency;
    document.getElementById("alertDialog").style.display = "flex";
}

function closeDialog() {
    document.getElementById("alertDialog").style.display = "none";
    document.getElementById("alert-btn").innerText = "Send Alert";
}

async function sendAlert() {
    name = document.getElementById("childName").value.trim() || 'Not provided';
    contact = document.getElementById("contactNumber").value.trim() || 'Not provided';
    description = document.getElementById("description").value.trim() || 'Not provided';

    if ("geolocation" in navigator) {
        try {
            const position = await getCurrentLocation();
            lat = position.coords.latitude;
            long = position.coords.longitude;

            await submitRequest(name, contact, selectedEmergency, description, lat, long);
            closeDialog();
        } catch (error) {
            alert("Location access denied. Unable to send location.");
        }
    } else {
        alert("Geolocation is not supported by this device.");
    }
}

function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
}

async function submitRequest(name, contact, emergency, description, lat, long) {
    document.getElementById("alert-btn").innerText = "Sending...";
    const success = await insertData('child_emergency', {name, contact, emergency, description, lat, long, picture});
      if(success) {          
          alert("Alert sent! \n\nWe're on our way to help you. Stay brave and know that you're safe.");
      } else {
          alert('Error submitting alert!');
      }      
}


        document.getElementById("captureBtn").addEventListener("click", function() {
            document.getElementById("cameraInput").click(); 
        });

document.getElementById("cameraInput").addEventListener("change", function(event) {
    let file = event.target.files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = function(e) {
            let img = new Image();
            img.src = e.target.result;
            img.onload = function() {
                let canvas = document.createElement("canvas");
                let ctx = canvas.getContext("2d");

                // Set desired width and height (resize)
                const maxWidth = 400; // Reduce width for optimization
                const maxHeight = 400; // Reduce height for optimization
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to Base64 with compression (JPEG format, 0.6 quality)
                let compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);

                document.getElementById("preview").src = compressedBase64;
                document.getElementById("preview").style.display = "block";
                document.getElementById("fileLabel").textContent = "Picture"; // Show "Picture" as file name

                // Store the optimized base64 string
                picture = compressedBase64;
            };
        };
        reader.readAsDataURL(file);
    }
});
