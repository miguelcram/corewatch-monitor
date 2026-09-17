package com.corewatch.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Getter
@Setter
public class TransactionRequestDTO {

    @NotBlank(message = "Source account cannot be empty")
    private String sourceAccount;

    @NotBlank(message = "Destination account cannot be empty")
    private String destinationAccount;

    @NotNull(message = "Amount is mandatory")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    @NotBlank(message = "Currency cannto be empty")
    private String currency;
}
