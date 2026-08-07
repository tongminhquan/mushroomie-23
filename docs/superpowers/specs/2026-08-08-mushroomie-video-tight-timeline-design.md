# Mushroomie 43-Second Tight Timeline Design

**Date:** 2026-08-08

**Status:** Thiết kế đã được duyệt trong hội thoại; chờ duyệt bản spec thành văn bản

**Định dạng:** 1920×1080, 16:9, 30 fps, tiếng Việt

## 1. Mục tiêu

Rút video giới thiệu Mushroomie từ 60 giây xuống đúng 43 giây bằng cách loại bỏ thời gian chờ ở cuối từng cảnh và không phát phần đuôi im lặng thừa của voice-over. Giữ nguyên toàn bộ chín cảnh, nội dung thuyết minh, slogan “Làm bằng tay, trao bằng tim”, giao diện mobile mới và bố cục đã sửa không chồng chữ.

Video mới phải có nhịp dựng nhanh, nhiệt huyết và liên tục hơn nhưng vẫn đủ thời gian đọc phụ đề, nghe trọn câu và nhìn thấy trạng thái hoàn chỉnh của từng animation.

## 2. Nguyên nhân khoảng trống

Timeline hiện tại cấp 60 giây cho chín cảnh, trong khi tổng độ dài media voice-over chỉ khoảng 42,77 giây. Phần thời lượng cảnh còn lại sau khi từng file voice-over kết thúc là khoảng 17,23 giây. Ngoài ra, mỗi file TTS thường có khoảng 0,16–0,28 giây im lặng đầu clip và 0,49–0,78 giây im lặng cuối clip.

Khoảng nghỉ ngắn bên trong câu là một phần của ngữ điệu tiếng Việt và không phải lỗi. Chỉ phần im lặng đầu/cuối file và phần giữ cảnh quá dài sau câu nói mới bị loại bỏ.

## 3. Hướng xử lý đã duyệt

Áp dụng thời lượng riêng cho từng cảnh dựa trên thời điểm kết thúc lời nói và mốc animation cuối cùng. Không tăng tốc đồng đều toàn video và không cắt hậu kỳ trực tiếp trên MP4, vì hai cách đó có thể làm lệch caption, hiệu ứng âm thanh và chuyển động.

Voice-over giữ nguyên giọng `vi-VN-NamMinhNeural`, nội dung, rate, pitch, volume và file media hiện tại. Pipeline tạo voice sẽ đo thời điểm mẫu âm thanh có lời cuối cùng; `Sequence` chỉ cắt phần đuôi đã được xác nhận là im lặng. Không tái mã hóa, không cắt im lặng đầu file, không xóa khoảng ngắt tự nhiên bên trong câu và không time-stretch giọng đọc.

## 4. Timeline 43 giây

Tổng thời lượng mới là 1.290 frame, tương đương đúng 43,0 giây ở 30 fps.

| Cảnh | Frame mới | Thời gian | Thời lượng |
|---|---:|---:|---:|
| Hook | 0–119 | 00:00,0–00:04,0 | 120 frame / 4,0s |
| Website | 120–263 | 00:04,0–00:08,8 | 144 frame / 4,8s |
| Products | 264–413 | 00:08,8–00:13,8 | 150 frame / 5,0s |
| Custom | 414–590 | 00:13,8–00:19,7 | 177 frame / 5,9s |
| Handmade | 591–764 | 00:19,7–00:25,5 | 174 frame / 5,8s |
| Features | 765–941 | 00:25,5–00:31,4 | 177 frame / 5,9s |
| Shopping flow/mobile | 942–1088 | 00:31,4–00:36,3 | 147 frame / 4,9s |
| Slogan | 1089–1205 | 00:36,3–00:40,2 | 117 frame / 3,9s |
| CTA | 1206–1289 | 00:40,2–00:43,0 | 84 frame / 2,8s |

Các khoảng frame liên tục, không có frame trống và không chồng lấn hai scene.

## 5. Caption và lời thuyết minh

Caption dùng cùng ranh giới thời gian với scene:

| Caption | `startMs` | `endMs` |
|---|---:|---:|
| Hook | 0 | 4.000 |
| Website | 4.000 | 8.800 |
| Products | 8.800 | 13.800 |
| Custom | 13.800 | 19.700 |
| Handmade | 19.700 | 25.500 |
| Features | 25.500 | 31.400 |
| Shopping flow/mobile | 31.400 | 36.300 |
| Slogan | 36.300 | 40.200 |
| CTA | 40.200 | 43.000 |

Mỗi câu thuyết minh bắt đầu cùng scene tương ứng. Phần có lời được phép kết thúc trước scene khoảng 0,3–1,0 giây để hình và phụ đề có thời gian ổn định. Không được cắt mất âm tiết cuối, tên miền hoặc vế “trao bằng tim”.

Caption tiếp tục dùng tối đa hai dòng, font 38px và hành lang lower-third hiện tại. Việc retime không được làm product card, custom card hoặc mobile frame chồng lên caption.

## 6. Hợp đồng chuyển động

- Hook vẫn hiện đủ hai nhịp tiêu đề; nhịp thứ hai hoàn tất ở local frame 76, trước khi scene kết thúc ở frame 119.
- Website giữ browser frame và chips; camera zoom phải hoàn tất trong 144 frame thay vì tiếp tục dùng mốc 180 frame cũ.
- Products giữ ba thẻ lớn, tỷ lệ ảnh 3:4 và khoảng cách an toàn với tiêu đề/phụ đề.
- Custom giữ đủ ba chip, product reveal và tiêu đề; animation cuối hoàn tất ở local frame 140, còn 37 frame ổn định.
- Handmade giữ đủ ba bước; đường nối hoàn tất ở local frame 122, còn 52 frame ổn định.
- Features giữ đủ bốn tile; tile cuối hoàn tất trước local frame 56.
- Shopping flow giữ đủ ba bước và giao diện mobile production; mobile frame hoàn tất ở local frame 124, còn 23 frame ổn định.
- Slogan hiện đủ hai vế ở local frame 85, còn 32 frame ổn định.
- CTA hoàn tất settle ở local frame 70, còn 14 frame để đọc domain và CTA.

Không dùng CSS transition/keyframe. Toàn bộ chuyển động tiếp tục được điều khiển bằng frame, `interpolate()` và easing của Remotion.

## 7. Đồng bộ cấu hình

Các nguồn thời gian phải dùng cùng một hợp đồng 1.290 frame:

- `VIDEO_CONFIG.durationInFrames`;
- ranh giới `SCENES`;
- `captions.json`;
- duration của composition trong `Root`;
- progress line;
- music fade-out;
- giới hạn và sequence voice-over;
- duration truyền vào `SceneShell`;
- keyframe review và metadata validator.

`ProgressLine` phải đọc cấu hình chung thay vì giữ literal 1.800 frame riêng. Không được để thêm một nguồn duration độc lập có thể lệch khỏi composition.

## 8. Xử lý voice asset

Pipeline voice-over sẽ:

1. Tạo file bằng Edge TTS với cấu hình hiện tại khi cần tái tạo.
2. Probe tổng duration và đo thời điểm mẫu âm thanh có lời cuối cùng bằng FFmpeg.
3. Cho phép `Sequence` kết thúc trước duration vật lý của file chỉ khi toàn bộ phần bị cắt đã được xác nhận là im lặng cuối clip.
4. Giữ nguyên khoảng im lặng đầu và các khoảng nghỉ bên trong câu.
5. Fail nếu mẫu âm thanh có lời cuối cùng vượt quá scene hoặc không còn safety margin tối thiểu.

Các file voice hiện tại được dùng lại nguyên trạng. Không thay đổi câu chữ, phát âm thương hiệu, codec hoặc chất lượng voice trong phạm vi task này.

## 9. Âm thanh và mix

- Nhạc nền tiếp tục chạy liên tục từ đầu đến cuối composition mới.
- Fade-in giữ ngắn ở đầu video; fade-out được tính theo 1.290 frame mới.
- Whoosh, pop và shimmer tiếp tục bám theo scene tương ứng.
- Không có hai voice-over chồng lên nhau.
- Mục tiêu loudness là khoảng -16 LUFS; true peak không vượt -1 dBFS sau bước finalize.
- Không có khoảng không tiếng kéo dài giữa hai câu ngoài nhịp nghỉ chuyển cảnh chủ ý không quá khoảng 1,0 giây.

## 10. Kiểm thử và xác minh

### Kiểm thử tự động

- Test cấu hình yêu cầu 1.290 frame và 43 giây.
- Test scene registry yêu cầu chín scene liên tục từ frame 0 đến 1.289, đúng duration trong bảng.
- Test caption yêu cầu chín caption liên tục từ 0 đến 43.000 ms và khớp scene.
- Test progress line không được chứa literal 1.800 frame.
- Test voice pipeline xác nhận mẫu âm thanh có lời cuối cùng nằm trong scene; chỉ phần im lặng cuối clip mới được phép bị cắt.
- Các visual contract test hiện tại về caption corridor, product card 3:4, custom label và mobile frame vẫn phải pass.

### Kiểm tra hình ảnh

- Render một frame ổn định cho cả chín scene theo timeline mới.
- Render thêm frame ngay trước và sau từng điểm cắt scene để phát hiện frame trống, nội dung biến mất sớm hoặc phụ đề sai.
- Kiểm tra riêng Products, Custom và Shopping flow/mobile vì đây là ba cảnh đã được sửa overlap trước đó.
- Không có ảnh vỡ, chữ lỗi dấu, caption bị cắt hoặc hình đè chữ.

### Kiểm tra video cuối

- Render file mới, không ghi đè bản 60 giây.
- Decode đầy đủ cả video và audio bằng FFmpeg.
- FFprobe xác nhận 1920×1080, 30 fps, H.264, yuv420p, AAC stereo và thời lượng khoảng 43,0 giây.
- Đo EBU R128 và true peak.
- Lấy frame trực tiếp từ MP4 tại ba cảnh Products, Custom và Shopping flow/mobile để kiểm tra thành phẩm.
- Nghe toàn bộ chín điểm nối voice-over để xác nhận không mất chữ và không còn dead air đáng kể.

## 11. File đầu ra

File giao dự kiến:

`artifacts/mushroomie-brand-video/mushroomie-website-intro-43s-16x9-v1.mp4`

Bản 60 giây hiện tại được giữ nguyên để rollback và so sánh.

## 12. Phạm vi và non-goals

Trong phạm vi:

- retime video Remotion;
- đo speech-end và cắt phần đuôi im lặng bằng giới hạn `Sequence`;
- đồng bộ caption, animation, progress và audio;
- render và kiểm tra bản 43 giây.

Ngoài phạm vi:

- thay đổi nội dung thuyết minh hoặc slogan;
- đổi giọng đọc;
- thêm/xóa scene hoặc sản phẩm;
- sửa website production;
- deploy PM2/Nginx;
- thay đổi database, auth, checkout, thanh toán hoặc upload;
- xóa hoặc ghi đè bản MP4 60 giây hiện tại.

## 13. Tiêu chí hoàn tất

Task chỉ được coi là hoàn tất khi:

- composition có đúng 1.290 frame;
- file MP4 dài khoảng 43 giây và đúng chuẩn media đã nêu;
- chín scene và chín câu thuyết minh đều đầy đủ;
- không có dead air kéo dài giữa scene;
- không mất âm tiết cuối hoặc tên miền;
- caption đồng bộ, dễ đọc và không chồng hình;
- tất cả test/typecheck pass;
- frame kiểm tra lấy trực tiếp từ MP4 cuối không có lỗi bố cục;
- bản 60 giây cũ vẫn còn nguyên vẹn.
