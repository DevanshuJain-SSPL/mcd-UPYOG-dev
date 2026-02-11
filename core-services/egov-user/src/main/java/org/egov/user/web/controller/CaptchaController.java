package org.egov.user.web.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;

import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import javax.imageio.ImageIO;

@Slf4j
@RestController
@RequestMapping("/api")
public class CaptchaController {

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    private static final int CAPTCHA_EXPIRY_SECONDS = 120;
    
    @GetMapping(value = "/captcha", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> generateCaptcha() throws Exception {

        String captchaText = generateRandomText(6);
        String captchaId = UUID.randomUUID().toString();

        redisTemplate.opsForValue().set(
                "CAPTCHA:" + captchaId,
                captchaText,
                CAPTCHA_EXPIRY_SECONDS,
                TimeUnit.SECONDS
        );

        byte[] imageBytes = generateCaptchaImage(captchaText);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_PNG);
        headers.setCacheControl("no-store, no-cache, must-revalidate");
        headers.setPragma("no-cache");

        // IMPORTANT: Send captchaId in header
        headers.add("Captcha-Id", captchaId);

        return new ResponseEntity<>(imageBytes, headers, HttpStatus.OK);
    }

	
    @GetMapping(value = "/captcha/image")
    public ResponseEntity<String> generateCaptchaImage() {

        String captchaText = generateRandomText(6);
        String captchaId = UUID.randomUUID().toString();

        redisTemplate.opsForValue().set(
                "CAPTCHA:" + captchaId,
                captchaText,
                CAPTCHA_EXPIRY_SECONDS,
                TimeUnit.SECONDS
        );

        String svg = generateSvgCaptcha(captchaText);

        return ResponseEntity
                .ok()
                .header("Content-Type", "image/svg+xml")
                .body(svg);
    }

    private String generateRandomText(int length) {

        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random random = new Random();
        StringBuilder sb = new StringBuilder();

        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }

        return sb.toString();
    }
    
    /**
     * Generate captcha using SVG
     * @param text
     * @return
     */
    private String generateSvgCaptcha(String text) {

        int width = 160;
        int height = 60;

        StringBuilder svg = new StringBuilder();

        svg.append("<svg xmlns='http://www.w3.org/2000/svg' ")
           .append("width='").append(width).append("' ")
           .append("height='").append(height).append("' ")
           .append("viewBox='0 0 ").append(width).append(" ").append(height).append("'>");

        // background
        svg.append("<rect width='100%' height='100%' fill='#f2f2f2'/>");

        Random random = new Random();
        int x = 20;

        // draw each character separately (allows distortion later)
        for (char c : text.toCharArray()) {
            int y = 35 + random.nextInt(10) - 5;      // vertical jitter
            int rotate = random.nextInt(30) - 15;     // rotation

            svg.append("<text ")
               .append("x='").append(x).append("' ")
               .append("y='").append(y).append("' ")
               .append("font-size='28' ")
               .append("fill='#333' ")
               .append("font-family='monospace' ")
               .append("transform='rotate(")
               .append(rotate).append(" ")
               .append(x).append(" ")
               .append(y).append(")'>")
               .append(c)
               .append("</text>");

            x += 22;
        }

        // noise lines
        for (int i = 0; i < 3; i++) {
            svg.append("<line ")
               .append("x1='").append(random.nextInt(width)).append("' ")
               .append("y1='").append(random.nextInt(height)).append("' ")
               .append("x2='").append(random.nextInt(width)).append("' ")
               .append("y2='").append(random.nextInt(height)).append("' ")
               .append("stroke='#999' stroke-width='1'/>");
        }

        svg.append("</svg>");

        return svg.toString();
    }
    
    
    /**
     * Generate Captcha Image in PNG format
     * @param text
     * @return
     * @throws Exception
     */
    private byte[] generateCaptchaImage(String text) throws Exception {

        int width = 160;
        int height = 60;

        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();

        // Background
        g.setColor(Color.LIGHT_GRAY);
        g.fillRect(0, 0, width, height);

        // Text settings
        g.setFont(new Font("Arial", Font.BOLD, 28));
        g.setColor(Color.BLACK);

        Random random = new Random();
        int x = 20;

        for (char c : text.toCharArray()) {
            int y = 35 + random.nextInt(10);
            int angle = random.nextInt(30) - 15;

            g.rotate(Math.toRadians(angle), x, y);
            g.drawString(String.valueOf(c), x, y);
            g.rotate(Math.toRadians(-angle), x, y);

            x += 22;
        }

        // Noise lines
        g.setColor(Color.GRAY);
        for (int i = 0; i < 5; i++) {
            int x1 = random.nextInt(width);
            int y1 = random.nextInt(height);
            int x2 = random.nextInt(width);
            int y2 = random.nextInt(height);
            g.drawLine(x1, y1, x2, y2);
        }

        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "png", baos);

        return baos.toByteArray();
    }

	
}

