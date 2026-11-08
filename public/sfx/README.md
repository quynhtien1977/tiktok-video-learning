Bỏ các đoạn tiếng phi lời nói vào đây, đặt tên dễ gọi:

  cuoi-nhe.mp3     cười khẽ một tiếng, ~0.6s
  cuoi.mp3         cười bình thường, ~1s
  tho-dai.mp3      thở dài, ~0.8s
  hum.mp3          "hừm" ngẫm nghĩ, ~0.5s

Tự thu bằng điện thoại là tốt nhất — tiếng cười người thật nghe hơn hẳn mọi
thứ TTS tổng hợp ra, và đây là cách duy nhất có tiếng cười khi không dùng ElevenLabs.
Thu ở nơi yên tĩnh, cắt sát hai đầu, xuất mono.

Dùng trong content/epNN.json:

  "inserts": [{ "after": "rất", "file": "sfx/cuoi-nhe.mp3", "gainDb": -2 }]

Rồi chạy: npm run voice → npm run align → npm run sfx → npm run sync → npm run render
