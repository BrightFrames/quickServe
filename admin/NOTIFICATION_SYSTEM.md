# Notification System Documentation

## Overview
The QuickServe admin panel includes a comprehensive notification system with unique sounds for different events.

## Features

### 1. Kitchen Panel Notifications

#### New Order Sound
- **Trigger**: When a new order is placed by a customer
- **Sound**: Pleasant "ding-ding" sound (800Hz → 600Hz)
- **Visual**: Toast notification with order number and table
- **Duration**: 5 seconds
- **Purpose**: Alerts kitchen staff to new orders immediately

#### Order Delivered Sound
- **Trigger**: When an order is marked as delivered
- **Sound**: Ascending success tone (400Hz → 600Hz → 800Hz)
- **Visual**: Toast notification
- **Purpose**: Confirms successful order completion

### 2. Admin Panel Notifications

#### Low Stock Alert
- **Trigger**: When inventory items reach their threshold level
- **Sound**: Triple beep alert (440Hz square wave)
- **Visual**: 
  - Red badge on Inventory sidebar tab showing count
  - Toast warning notification
  - Red highlighting on low stock items in table
- **Check Frequency**: Every 30 seconds
- **Purpose**: Alerts admin to restock items before they run out

#### Critical Stock Alert
- **Trigger**: When items fall below 50% of threshold
- **Sound**: Urgent siren (300Hz ↔ 600Hz oscillating)
- **Visual**: 
  - Critical error toast with item names
  - Red badge on Inventory tab
  - Red highlighting in inventory table
- **Duration**: 8 seconds
- **Purpose**: Urgent alert for immediate restocking

## Technical Implementation

### Sound Generation
- Uses Web Audio API for browser-based sound generation
- No external audio files needed
- Different waveforms and frequencies for distinct sounds:
  - **Sine waves**: Pleasant notifications (orders)
  - **Square waves**: Warning alerts (low stock)
  - **Sawtooth waves**: Critical alerts (very low stock)

### Notification Class Location
```
admin/src/utils/notificationSounds.ts
```

### Methods Available
```typescript
notificationSounds.playNewOrderSound()     // Kitchen: New order
notificationSounds.playSuccessSound()      // Kitchen: Order delivered
notificationSounds.playLowStockAlert()     // Admin: Low stock
notificationSounds.playCriticalAlert()     // Admin: Critical stock
```

## Real-time Updates

### Kitchen Panel
- Listens to Socket.IO "new-order" events
- Automatic sound playback on new orders
- Toast notifications with order details

### Admin Panel
- Polls inventory every 60 seconds (header badge)
- Checks inventory every 30 seconds (inventory page)
- Plays alert only when new items go low (not on every check)

## User Experience

### Sound Design
All sounds are:
- ✅ Short (0.3s - 0.7s)
- ✅ Non-intrusive (low volume)
- ✅ Distinct from each other
- ✅ Professional and pleasant
- ✅ No external dependencies

### Visual Feedback
- Toast notifications with context
- Animated badge on sidebar tabs
- Color-coded alerts (yellow/red)
- Table row highlighting

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires user interaction before first sound (browser policy)
- Graceful degradation if audio not available

## Customization

### Adjust Sound Volume
Edit `gainNode.gain.setValueAtTime(value, time)` in `notificationSounds.ts`
- Default values: 0.15 - 0.3
- Range: 0.0 (silent) to 1.0 (loud)

### Adjust Check Frequency
Edit intervals in component `useEffect`:
- Kitchen: Real-time (Socket.IO)
- Admin header: 60000ms (1 minute)
- Admin inventory: 30000ms (30 seconds)

### Adjust Threshold Sensitivity
Edit critical stock calculation in `InventoryManagement.tsx`:
```typescript
// Current: 50% of threshold
item.inventoryCount <= item.lowStockThreshold / 2

// More sensitive (75%):
item.inventoryCount <= item.lowStockThreshold * 0.75
```

## Testing

### Test New Order Notification
1. Open Kitchen panel (`/kitchen`)
2. Place an order from customer app
3. Should hear "ding-ding" sound and see toast

### Test Low Stock Alert
1. Open Admin panel Inventory tab
2. Reduce item stock below threshold
3. Wait 30 seconds
4. Should hear triple beep and see badge

### Test Critical Alert
1. Reduce stock below 50% of threshold
2. Wait 30 seconds
3. Should hear siren sound and see critical toast

## Troubleshooting

### No Sound Playing
- Check browser audio permissions
- Ensure user has interacted with page first
- Check browser console for errors
- Verify AudioContext is supported

### Sounds Not Distinct Enough
- Adjust frequencies in `notificationSounds.ts`
- Change waveform types (sine/square/sawtooth)
- Modify duration and gain curves

### Too Many Notifications
- Increase polling intervals
- Adjust threshold sensitivity
- Implement "snooze" feature for alerts
