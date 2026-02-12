const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dwwk10ror',
  api_key: '288113269732148',
  api_secret: '5lQAm3aEoDZxKTD8OublBWGJClg'
});

async function verify() {
  console.log("Testing Cloudinary Connection...");
  try {
    const result = await cloudinary.api.ping();
    console.log("✅ API Credentials: Valid");
    
    // Check for the preset
    try {
        const presets = await cloudinary.api.upload_presets({ max_results: 500 });
        const preset = presets.presets.find(p => p.name === 'social_hub_default');
        
        if (preset) {
            console.log("✅ Upload Preset 'social_hub_default': Found");
            if (preset.unsigned) {
                console.log("✅ Preset Mode: Unsigned (Correct)");
            } else {
                console.error("❌ Preset Mode: Signed (Incorrect - must be Unsigned)");
            }
        } else {
            console.error("❌ Upload Preset 'social_hub_default': NOT FOUND");
            console.log("   (Did you name it exactly 'social_hub_default'?)");
        }
    } catch (e) {
        console.error("⚠️ Could not list presets:", e.message);
    }

  } catch (error) {
    console.error("❌ API Connection Failed:", error.message);
  }
}

verify();
