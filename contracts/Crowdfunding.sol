// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Crowdfunding {
  struct Campaign {
    address creator;
    string title;
    uint256 goal;
    uint256 deadline;
    uint256 raised;
    bool completed;
  }

  Campaign[] public campaigns;
  mapping(uint256 => mapping(address => uint256)) public contributions;

  event CampaignCreated(uint256 indexed campaignId, address creator, string title, uint256 goal, uint256 deadline);
  event ContributionMade(uint256 indexed campaignId, address contributor, uint256 amount);
  event FundsReleased(uint256 indexed campaignId, uint256 amount);
  event RefundIssued(uint256 indexed campaignId, address contributor, uint256 amount);

  function createCampaign(string memory _title, uint256 _goal, uint256 _deadline) public {
    require(_deadline > block.timestamp, "Deadline must be in the future");
    campaigns.push(Campaign(msg.sender, _title, _goal, _deadline, 0, false));
    emit CampaignCreated(campaigns.length - 1, msg.sender, _title, _goal, _deadline);
  }

  function contribute(uint256 _campaignId) public payable {
    require(_campaignId < campaigns.length, "Campaign does not exist");
    require(msg.value > 0, "Contribution must be greater than 0");
    Campaign storage campaign = campaigns[_campaignId];
    require(block.timestamp < campaign.deadline, "Campaign ended");
    require(!campaign.completed, "Campaign completed");
    campaign.raised += msg.value;
    contributions[_campaignId][msg.sender] += msg.value;
    emit ContributionMade(_campaignId, msg.sender, msg.value);
  }

  function releaseFunds(uint256 _campaignId) public {
    require(_campaignId < campaigns.length, "Campaign does not exist");
    Campaign storage campaign = campaigns[_campaignId];
    require(msg.sender == campaign.creator, "Only creator can release funds");
    require(block.timestamp >= campaign.deadline, "Campaign still active");
    require(campaign.raised >= campaign.goal, "Goal not met");
    require(!campaign.completed, "Funds already released");
    campaign.completed = true;
    payable(campaign.creator).transfer(campaign.raised);
    emit FundsReleased(_campaignId, campaign.raised);
  }

  function refund(uint256 _campaignId) public {
    require(_campaignId < campaigns.length, "Campaign does not exist");
    Campaign storage campaign = campaigns[_campaignId];
    require(block.timestamp >= campaign.deadline, "Campaign still active");
    require(campaign.raised < campaign.goal, "Goal met");
    require(!campaign.completed, "Campaign completed");
    require(contributions[_campaignId][msg.sender] > 0, "No contribution");
    uint256 amount = contributions[_campaignId][msg.sender];
    contributions[_campaignId][msg.sender] = 0;
    payable(msg.sender).transfer(amount);
    emit RefundIssued(_campaignId, msg.sender, amount);
  }

  function getCampaignCount() public view returns (uint256) {
    return campaigns.length;
  }
}