// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract IASERewardDistributorUltraSimple {
    address public owner;
    IERC20 public iaseToken;
    
    event RewardClaimed(address indexed user, uint256 amount);
    
    constructor(address _tokenAddress) {
        owner = msg.sender;
        iaseToken = IERC20(_tokenAddress);
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Non sei il proprietario");
        _;
    }
    
    function claimReward(address to, uint256 amount) external {
        // La verifica e il tracking avviene off-chain tramite backend
        // Il contratto si occupa solo di trasferire i token
        uint256 balance = iaseToken.balanceOf(address(this));
        require(balance >= amount, "Saldo insufficiente nel contratto");
        
        require(iaseToken.transfer(to, amount), "Trasferimento fallito");
        emit RewardClaimed(to, amount);
    }
    
    // Funzione per verificare il saldo di IASE token nel contratto
    function getContractBalance() external view returns (uint256) {
        return iaseToken.balanceOf(address(this));
    }
    
    // Funzione di emergenza per recuperare token in caso di necessità
    function withdrawTokens(uint256 amount) external onlyOwner {
        require(iaseToken.transfer(owner, amount), "Trasferimento fallito");
    }
}