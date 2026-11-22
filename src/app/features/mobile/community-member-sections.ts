import type { CommunityMemberView } from '../../services/community-api.service';
export function communityMemberSections(members: readonly CommunityMemberView[]) {
  const unique = [...new Map(members.map(member => [member.personId, member])).values()]
    .sort((a,b) => a.lastName.localeCompare(b.lastName,'it',{sensitivity:'base'}) || a.firstName.localeCompare(b.firstName,'it',{sensitivity:'base'}));
  return [
    {title:'Presbitero', members:unique.filter(m=>m.role === 'PRESBYTER')},
    {title:'Responsabile', members:unique.filter(m=>m.role === 'RESPONSIBLE')},
    {title:'Corresponsabili', members:unique.filter(m=>m.role === 'CO_RESPONSIBLE')},
    {title:'Fratelli', members:unique}
  ].filter(section=>section.members.length > 0);
}
