// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ChainlinkOracle {
    function requestPlaidBalance(string calldata userId) external returns (bytes32 requestId);
}

contract PlaidQuest {
    address public oracle;
    struct QuestResult {
        bool completed;
        uint256 value;
        string details;
    }
    // user => questId => QuestResult
    mapping(address => mapping(string => QuestResult)) public userQuestResults;
    event QuestCompleted(address indexed user, string questId, bool completed, uint256 value, string details);

    constructor(address _oracle) {
        oracle = _oracle;
    }

    // Called by frontend to request Plaid balance via Chainlink
    function requestBalance(string calldata userId) external {
        ChainlinkOracle(oracle).requestPlaidBalance(userId);
    }

    // Called by oracle to fulfill balance
    function fulfillQuest(
        address user,
        string calldata questId,
        bool completed,
        uint256 value,
        string calldata details
    ) external {
        require(msg.sender == oracle, "Only oracle can fulfill");
        userQuestResults[user][questId] = QuestResult(completed, value, details);
        emit QuestCompleted(user, questId, completed, value, details);
    }
}
