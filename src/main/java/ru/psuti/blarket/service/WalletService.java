package ru.psuti.blarket.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import ru.psuti.blarket.dto.cart.transaction.TopUpRequestDTO;
import ru.psuti.blarket.dto.cart.transaction.TransactionDTO;
import ru.psuti.blarket.dto.cart.transaction.WalletDTO;
import ru.psuti.blarket.model.Transaction;
import ru.psuti.blarket.model.TransactionStatus;
import ru.psuti.blarket.model.Wallet;
import ru.psuti.blarket.model.user.User;
import ru.psuti.blarket.repository.TransactionRepository;
import ru.psuti.blarket.repository.WalletRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Logger logger = LoggerFactory.getLogger(WalletService.class);

    private static final String YOOMONEY_API_URL = "https://api.yookassa.ru/v3/payments";
    private static final String YOOMONEY_SHOP_ID = "1101339";
    private static final String YOOMONEY_SECRET_KEY = "test_MvcOTapkHCNgyXXy2sL_m3SDYZSL1zLcsQRQJxCmwcg"; // Замени на твой secretKey

    public WalletDTO getWallet(Long userId) {
        logger.info("Fetching wallet for userId: {}", userId);
        Wallet wallet = walletRepository.findByUserId(userId);
        if (wallet == null) {
            wallet = Wallet.builder()
                    .user(User.builder().id(userId).build())
                    .balance(0.0)
                    .build();
            walletRepository.save(wallet);
            logger.info("Created new wallet for userId: {}", userId);
        }
        WalletDTO dto = new WalletDTO();
        dto.setUserId(userId);
        dto.setBalance(wallet.getBalance());
        return dto;
    }

    public String initiateTopUp(TopUpRequestDTO request) {
        if (request.getAmount() <= 0) {
            throw new IllegalArgumentException("Сумма должна быть больше 0");
        }

        logger.info("Initiating top-up for userId: {}, amount: {}", request.getUserId(), request.getAmount());

        Wallet wallet = walletRepository.findByUserId(request.getUserId());
        if (wallet == null) {
            wallet = Wallet.builder()
                    .user(User.builder().id(request.getUserId()).build())
                    .balance(0.0)
                    .build();
            walletRepository.save(wallet);
            logger.info("Created new wallet for userId: {}", request.getUserId());
        }

        String transactionId = UUID.randomUUID().toString();
        String paymentRequest = String.format(
                Locale.US,
                "{\"amount\":{\"value\":\"%.2f\",\"currency\":\"RUB\"},\"confirmation\":{\"type\":\"redirect\",\"return_url\":\"http://localhost:5173/wallet?transactionId=%s\"},\"capture\":true,\"description\":\"Пополнение кошелька пользователя %d\"}",
                request.getAmount(), transactionId, request.getUserId()
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setBasicAuth(YOOMONEY_SHOP_ID, YOOMONEY_SECRET_KEY);
        String idempotencyKey = UUID.randomUUID().toString();
        headers.set("Idempotence-Key", idempotencyKey);
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);

        logger.debug("Request headers: Idempotence-Key={}, Content-Type={}", idempotencyKey, headers.getContentType());
        logger.debug("Sending payment request to YooMoney: {}", paymentRequest);

        HttpEntity<String> entity = new HttpEntity<>(paymentRequest, headers);
        try {
            ResponseEntity<String> response = restTemplate.exchange(YOOMONEY_API_URL, HttpMethod.POST, entity, String.class);
            JsonNode jsonNode = objectMapper.readTree(response.getBody());
            String paymentId = jsonNode.path("id").asText();
            String confirmationUrl = jsonNode.path("confirmation").path("confirmation_url").asText();
            if (confirmationUrl.isEmpty()) {
                logger.error("No confirmation_url in response: {}", response.getBody());
                throw new RuntimeException("Не удалось извлечь confirmation_url");
            }

            // Сохраняем транзакцию после получения ответа от YooMoney
            Transaction transaction = Transaction.builder()
                    .wallet(wallet)
                    .amount(request.getAmount())
                    .status(TransactionStatus.PENDING)
                    .createdAt(LocalDateTime.now())
                    .paymentId(paymentId)
                    .transactionId(transactionId)
                    .build();
            transactionRepository.save(transaction);

            logger.info("Payment initiated, paymentId: {}, transactionId: {}, confirmation_url: {}", paymentId, transactionId, confirmationUrl);
            return confirmationUrl;
        } catch (Exception e) {
            logger.error("Error initiating payment: {}", e.getMessage(), e);
            throw new RuntimeException("Ошибка при создании платежа: " + e.getMessage());
        }
    }

    public TransactionDTO checkPaymentStatus(String transactionId, Long userId) {
        logger.info("Checking payment status for transactionId: {}, userId: {}", transactionId, userId);

        Wallet wallet = walletRepository.findByUserId(userId);
        if (wallet == null) {
            wallet = Wallet.builder()
                    .user(User.builder().id(userId).build())
                    .balance(0.0)
                    .build();
            walletRepository.save(wallet);
            logger.info("Created new wallet for userId: {}", userId);
        }

        Transaction transaction = transactionRepository.findByTransactionId(transactionId);
        if (transaction == null) {
            logger.error("No transaction found for transactionId: {}", transactionId);
            throw new RuntimeException("Транзакция не найдена");
        }

        String paymentId = transaction.getPaymentId();
        HttpHeaders headers = new HttpHeaders();
        headers.setBasicAuth(YOOMONEY_SHOP_ID, YOOMONEY_SECRET_KEY);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    YOOMONEY_API_URL + "/" + paymentId,
                    HttpMethod.GET,
                    entity,
                    String.class
            );
            JsonNode jsonNode = objectMapper.readTree(response.getBody());
            String status = jsonNode.path("status").asText();
            double amount = jsonNode.path("amount").path("value").asDouble();

            TransactionStatus transactionStatus = "succeeded".equals(status) ? TransactionStatus.COMPLETED :
                    "canceled".equals(status) ? TransactionStatus.FAILED : TransactionStatus.PENDING;

            transaction.setStatus(transactionStatus);
            transaction.setAmount(amount);
            transaction.setCreatedAt(LocalDateTime.now());

            if (transactionStatus == TransactionStatus.COMPLETED) {
                wallet.setBalance(wallet.getBalance() + amount); // Исправлено: добавляем сумму к текущему балансу
                walletRepository.save(wallet);
                logger.info("Payment succeeded, updated balance for userId: {}, new balance: {}", userId, wallet.getBalance());
            } else if (transactionStatus == TransactionStatus.FAILED) {
                logger.warn("Payment failed for userId: {}, paymentId: {}", userId, paymentId);
            }

            transaction = transactionRepository.save(transaction);

            TransactionDTO dto = new TransactionDTO();
            dto.setId(transaction.getId());
            dto.setWalletId(wallet.getId());
            dto.setAmount(transaction.getAmount());
            dto.setStatus(transaction.getStatus().name());
            dto.setCreatedAt(transaction.getCreatedAt());
            return dto;
        } catch (Exception e) {
            logger.error("Error checking payment status: {}", e.getMessage(), e);
            transaction.setStatus(TransactionStatus.FAILED);
            transaction.setCreatedAt(LocalDateTime.now());
            transaction = transactionRepository.save(transaction);

            TransactionDTO dto = new TransactionDTO();
            dto.setId(transaction.getId());
            dto.setWalletId(wallet.getId());
            dto.setAmount(transaction.getAmount());
            dto.setStatus(transaction.getStatus().name());
            dto.setCreatedAt(transaction.getCreatedAt());
            return dto;
        }
    }

    public List<TransactionDTO> getTransactionHistory(Long userId) {
        logger.info("Fetching transaction history for userId: {}", userId);
        Wallet wallet = walletRepository.findByUserId(userId);
        if (wallet == null) {
            logger.warn("No wallet found for userId: {}", userId);
            return List.of();
        }
        return transactionRepository.findByWalletId(wallet.getId()).stream()
                .map(t -> {
                    TransactionDTO dto = new TransactionDTO();
                    dto.setId(t.getId());
                    dto.setWalletId(t.getWallet().getId());
                    dto.setAmount(t.getAmount());
                    dto.setStatus(t.getStatus().name());
                    dto.setCreatedAt(t.getCreatedAt());
                    return dto;
                })
                .collect(Collectors.toList());
    }
}