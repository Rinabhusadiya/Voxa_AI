package com.voxa.ai.bridge

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.hardware.camera2.CameraAccessException
import android.hardware.camera2.CameraManager
import android.net.Uri
import android.os.BatteryManager
import android.provider.ContactsContract
import android.webkit.JavascriptInterface
import android.widget.Toast
import androidx.core.content.ContextCompat
import org.json.JSONArray
import org.json.JSONObject
import java.net.URLEncoder

/**
 * VoxaWebInterface
 * Secure Kotlin JavaScript Interface exposed to the WebView as `window.VoxaAndroidBridge`.
 * Provides native bridge execution for phone calls, SMS intents, WhatsApp launches,
 * ContactsContract queries, camera flashlight toggling, and device app launching.
 */
class VoxaWebInterface(private val context: Context) {

    /**
     * Start Phone Call via Native Android Intent
     * Respects Android CALL_PHONE runtime permission; falls back to ACTION_DIAL if denied.
     */
    @JavascriptInterface
    fun makePhoneCall(phoneNumber: String): Boolean {
        return try {
            val cleanNumber = phoneNumber.replace("[^0-9+]".toRegex(), "")
            val intent: Intent

            if (ContextCompat.checkSelfPermission(context, Manifest.permission.CALL_PHONE) == PackageManager.PERMISSION_GRANTED) {
                // Direct Phone Call
                intent = Intent(Intent.ACTION_CALL, Uri.parse("tel:$cleanNumber"))
            } else {
                // Open Dialer with number pre-filled
                intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$cleanNumber"))
            }

            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    /**
     * Send SMS Message via Android Telephony Intent
     */
    @JavascriptInterface
    fun sendSMS(phoneNumber: String, message: String): Boolean {
        return try {
            val cleanNumber = phoneNumber.replace("[^0-9+]".toRegex(), "")
            val intent = Intent(Intent.ACTION_SENDTO).apply {
                data = Uri.parse("smsto:$cleanNumber")
                putExtra("sms_body", message)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    /**
     * Send WhatsApp Message via Android Intent
     */
    @JavascriptInterface
    fun sendWhatsApp(phoneNumber: String, message: String): Boolean {
        return try {
            val cleanNumber = phoneNumber.replace("[^0-9]".toRegex(), "")
            val encodedMessage = URLEncoder.encode(message, "UTF-8")
            val uri = Uri.parse("https://api.whatsapp.com/send?phone=$cleanNumber&text=$encodedMessage")
            val intent = Intent(Intent.ACTION_VIEW, uri).apply {
                setPackage("com.whatsapp")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            
            // Fallback to browser if WhatsApp is not installed
            if (intent.resolveActivity(context.packageManager) != null) {
                context.startActivity(intent)
            } else {
                val webIntent = Intent(Intent.ACTION_VIEW, uri).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(webIntent)
            }
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    /**
     * Query Device Contacts using Android ContactsContract
     * Returns JSON string with name, phone number, and type.
     */
    @JavascriptInterface
    fun getContactsJson(): String {
        val contactsArray = JSONArray()

        if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED) {
            return contactsArray.toString()
        }

        val projection = arrayOf(
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
            ContactsContract.CommonDataKinds.Phone.NUMBER,
            ContactsContract.CommonDataKinds.Phone.TYPE
        )

        val cursor = context.contentResolver.query(
            ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
            projection,
            null,
            null,
            "${ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME} ASC"
        )

        cursor?.use {
            val nameIndex = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME)
            val numberIndex = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)

            val seenNumbers = HashSet<String>()
            var count = 0

            while (it.moveToNext() && count < 250) {
                val name = it.getString(nameIndex) ?: "Unknown"
                val rawNumber = it.getString(numberIndex) ?: ""
                val cleanNumber = rawNumber.replace("[^0-9+]".toRegex(), "")

                if (cleanNumber.isNotEmpty() && !seenNumbers.contains(cleanNumber)) {
                    seenNumbers.add(cleanNumber)
                    val obj = JSONObject().apply {
                        put("name", name)
                        put("phone", cleanNumber)
                    }
                    contactsArray.put(obj)
                    count++
                }
            }
        }

        return contactsArray.toString()
    }

    /**
     * Launch External Installed App by Package Name
     */
    @JavascriptInterface
    fun openApp(packageName: String): Boolean {
        return try {
            val launchIntent = context.packageManager.getLaunchIntentForPackage(packageName)
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(launchIntent)
                true
            } else {
                false
            }
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    /**
     * Toggle Camera Hardware Flashlight / Torch
     */
    @JavascriptInterface
    fun toggleFlashlight(state: Boolean): Boolean {
        return try {
            val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
            val cameraId = cameraManager.cameraIdList[0]
            cameraManager.setTorchMode(cameraId, state)
            true
        } catch (e: CameraAccessException) {
            e.printStackTrace()
            false
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    /**
     * Get Device Battery Percentage
     */
    @JavascriptInterface
    fun getBatteryLevel(): Int {
        return try {
            val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
            batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
        } catch (e: Exception) {
            -1
        }
    }

    /**
     * Show Native Android Toast Notification
     */
    @JavascriptInterface
    fun showToast(message: String) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }

    /**
     * Bridge Status & Version
     */
    @JavascriptInterface
    fun isAndroidBridgeAvailable(): Boolean = true

    @JavascriptInterface
    fun getBridgeVersion(): String = "1.0.0"
}
