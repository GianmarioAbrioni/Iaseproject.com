// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IERC20 Interface
 * @dev Interfaccia semplificata per interagire con token ERC20
 */
interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

/**
 * @title IASERewardDistributor
 * @dev Contratto per la distribuzione delle ricompense di staking del token IASE
 * Versione semplificata senza dipendenze OpenZeppelin
 */
contract IASERewardDistributorSimple {
    // Indirizzo del token IASE
    IERC20 public iaseToken;
    
    // Proprietario del contratto
    address public owner;
    
    // Mapping degli operatori autorizzati a distribuire ricompense
    mapping(address => bool) public authorizedOperators;
    
    // Eventi
    event RewardDistributed(address indexed recipient, uint256 amount);
    event OperatorAdded(address indexed operator);
    event OperatorRemoved(address indexed operator);
    
    // Modifier per verificare che il chiamante sia il proprietario
    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }
    
    // Modifier per verificare che il chiamante sia un operatore autorizzato
    modifier onlyAuthorizedOperator() {
        require(authorizedOperators[msg.sender], "Caller is not authorized");
        _;
    }
    
    /**
     * @dev Costruttore - imposta il token IASE
     * @param _tokenAddress Indirizzo del contratto IASE Token
     */
    constructor(address _tokenAddress) {
        iaseToken = IERC20(_tokenAddress);
        owner = msg.sender;
        authorizedOperators[msg.sender] = true; // Il deployer è un operatore autorizzato
        emit OperatorAdded(msg.sender);
    }
    
    /**
     * @dev Aggiunge un operatore autorizzato
     * @param operator Indirizzo dell'operatore da autorizzare
     */
    function addOperator(address operator) external onlyOwner {
        authorizedOperators[operator] = true;
        emit OperatorAdded(operator);
    }
    
    /**
     * @dev Rimuove un operatore autorizzato
     * @param operator Indirizzo dell'operatore da rimuovere
     */
    function removeOperator(address operator) external onlyOwner {
        require(operator != owner, "Cannot remove owner as operator");
        authorizedOperators[operator] = false;
        emit OperatorRemoved(operator);
    }
    
    /**
     * @dev Distribuisce una ricompensa di token IASE a un destinatario (solo operatori autorizzati)
     * @param _recipient Indirizzo del destinatario che riceverà i token
     * @param _amount Quantità di token da distribuire
     * @return success Booleano che indica il successo dell'operazione
     */
    function distributeReward(address _recipient, uint256 _amount) 
        external 
        onlyAuthorizedOperator 
        returns (bool success) 
    {
        // Verifica che il contratto abbia abbastanza token
        uint256 contractBalance = iaseToken.balanceOf(address(this));
        require(contractBalance >= _amount, "Insufficient balance");
        
        // Trasferisci i token al destinatario
        bool transferred = iaseToken.transfer(_recipient, _amount);
        require(transferred, "Transfer failed");
        
        // Emetti evento
        emit RewardDistributed(_recipient, _amount);
        
        return true;
    }
    
    /**
     * @dev Permette a un utente di riscuotere le proprie ricompense
     * @param _recipient Indirizzo del destinatario che riceverà i token
     * @param _amount Quantità di token da riscuotere
     * @return success Booleano che indica il successo dell'operazione
     */
    function claimReward(address _recipient, uint256 _amount) 
        external
        returns (bool success) 
    {
        // Verifica che il chiamante sia lo stesso del destinatario per sicurezza
        require(msg.sender == _recipient, "Caller must be the recipient");
        
        // Verifica che il contratto abbia abbastanza token
        uint256 contractBalance = iaseToken.balanceOf(address(this));
        require(contractBalance >= _amount, "Insufficient balance");
        
        // Trasferisci i token al destinatario
        bool transferred = iaseToken.transfer(_recipient, _amount);
        require(transferred, "Transfer failed");
        
        // Emetti evento
        emit RewardDistributed(_recipient, _amount);
        
        return true;
    }
    
    /**
     * @dev Preleva token dal contratto (solo owner)
     * @param _to Indirizzo a cui inviare i token
     * @param _amount Quantità di token da prelevare
     */
    function withdraw(address _to, uint256 _amount) external onlyOwner {
        uint256 contractBalance = iaseToken.balanceOf(address(this));
        require(contractBalance >= _amount, "Insufficient balance");
        
        bool transferred = iaseToken.transfer(_to, _amount);
        require(transferred, "Transfer failed");
    }
    
    /**
     * @dev Ottiene il saldo di token IASE del contratto
     * @return balance Saldo di token IASE
     */
    function getBalance() external view returns (uint256 balance) {
        return iaseToken.balanceOf(address(this));
    }
    
    /**
     * @dev Cambia il proprietario del contratto
     * @param newOwner Nuovo indirizzo del proprietario
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner is the zero address");
        owner = newOwner;
        authorizedOperators[newOwner] = true; // Il nuovo proprietario diventa automaticamente operatore
    }
}