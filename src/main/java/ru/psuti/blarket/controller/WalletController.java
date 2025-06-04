package ru.psuti.blarket.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ru.psuti.blarket.dto.cart.transaction.TopUpRequestDTO;
import ru.psuti.blarket.dto.cart.transaction.TransactionDTO;
import ru.psuti.blarket.dto.cart.transaction.WalletDTO;
import ru.psuti.blarket.model.user.User;
import ru.psuti.blarket.service.WalletService;

import java.util.List;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping
    public WalletDTO getWallet(Authentication authentication) {
        Long userId = ((User) authentication.getPrincipal()).getId();
        return walletService.getWallet(userId);
    }

    @PostMapping("/top-up")
    public String initiateTopUp(@RequestBody TopUpRequestDTO request, Authentication authentication) {
        Long userId = ((User) authentication.getPrincipal()).getId();
        request.setUserId(userId);
        return walletService.initiateTopUp(request);
    }

    @GetMapping("/check-payment/{transactionId}")
    public TransactionDTO checkPaymentStatus(@PathVariable String transactionId, Authentication authentication) {
        Long userId = ((User) authentication.getPrincipal()).getId();
        return walletService.checkPaymentStatus(transactionId, userId);
    }

    @GetMapping("/history")
    public List<TransactionDTO> getTransactionHistory(Authentication authentication) {
        Long userId = ((User) authentication.getPrincipal()).getId();
        return walletService.getTransactionHistory(userId);
    }
}